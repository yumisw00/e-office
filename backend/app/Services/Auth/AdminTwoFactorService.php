<?php

namespace App\Services\Auth;

use App\Mail\Email;
use App\Models\SysUser;
use App\Models\SysTwoFactorChallenge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AdminTwoFactorService
{
    public function isEnabled(): bool
    {
        return (bool) config('security.admin_2fa_enabled', false);
    }

    public function requiresForGroup(?int $idGroup): bool
    {
        if (!$this->isEnabled() || !$idGroup) {
            return false;
        }

        if ((bool) config('security.admin_2fa_all_groups', false)) {
            return true;
        }

        $requiredGroups = array_map('intval', config('security.admin_2fa_group_ids', [1]));

        return in_array((int) $idGroup, $requiredGroups, true);
    }

    public function createChallenge(Request $request, object $user, array $contextPayload): SysTwoFactorChallenge
    {
        $this->assertOtpDeliveryReady($user);
        $this->invalidatePendingChallenges((int) $user->id_user, $contextPayload['id_group'] ?? null);

        [$otp, $challenge] = $this->generateChallenge($request, $user, $contextPayload, 0);

        try {
            $this->sendOtpEmail($user, $otp, $challenge->otp_expires_at);
        } catch (\RuntimeException $exception) {
            $challenge->delete();

            throw $exception;
        }

        return $challenge;
    }

    public function resendChallenge(Request $request, SysTwoFactorChallenge $challenge, object $user): SysTwoFactorChallenge
    {
        if ($challenge->verified_at) {
            throw new \RuntimeException('Kode OTP sudah digunakan.');
        }

        if ($challenge->resend_count >= $this->maxResends()) {
            throw new \RuntimeException('Batas kirim ulang OTP telah tercapai.');
        }

        $this->assertOtpDeliveryReady($user);
        $previousAttributes = $this->deliveryStateAttributes($challenge);

        [$otp, $updatedChallenge] = $this->generateChallenge(
            $request,
            $user,
            $challenge->context_payload ?? [],
            $challenge->resend_count + 1,
            $challenge
        );

        try {
            $this->sendOtpEmail($user, $otp, $updatedChallenge->otp_expires_at);
        } catch (\RuntimeException $exception) {
            $challenge->forceFill($previousAttributes)->save();

            throw $exception;
        }

        return $updatedChallenge;
    }

    public function verifyChallenge(object $user, int $challengeId, string $otpCode): array
    {
        $challenge = SysTwoFactorChallenge::query()
            ->where('id', $challengeId)
            ->where('id_user', $user->id_user)
            ->whereNull('deleted_at')
            ->first();

        if (!$challenge) {
            throw new \RuntimeException('Challenge 2FA tidak ditemukan.');
        }

        if ($challenge->verified_at) {
            throw new \RuntimeException('Kode OTP sudah digunakan.');
        }

        if ($challenge->attempt_count >= $challenge->max_attempt) {
            throw new \RuntimeException('Percobaan OTP melebihi batas maksimum.');
        }

        if (!$challenge->otp_expires_at || $challenge->otp_expires_at->isPast()) {
            throw new \RuntimeException('Kode OTP sudah kedaluwarsa.');
        }

        if (!Hash::check($otpCode, $challenge->otp_hash)) {
            $challenge->increment('attempt_count');

            throw new \RuntimeException('Kode OTP tidak valid.');
        }

        $challenge->forceFill([
            'verified_at' => now(),
        ])->save();

        return [
            'challenge' => $challenge,
            'context_payload' => $challenge->context_payload ?? [],
        ];
    }

    public function verifyChallengeById(int $challengeId, string $otpCode): array
    {
        $challenge = $this->findChallengeById($challengeId);

        if (!$challenge) {
            throw new \RuntimeException('Challenge 2FA tidak ditemukan.');
        }

        $user = SysUser::query()
            ->where('id_user', $challenge->id_user)
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            throw new \RuntimeException('User challenge 2FA tidak ditemukan.');
        }

        $result = $this->verifyChallenge($user, $challengeId, $otpCode);
        $result['user'] = $user;

        return $result;
    }

    public function buildChallengeResponse(object $user, SysTwoFactorChallenge $challenge): array
    {
        return [
            'requires_2fa' => true,
            'challenge_id' => $challenge->id,
            'delivery_channel' => 'email',
            'masked_destination' => $this->maskEmail((string) $user->email),
            'expires_in_seconds' => max(0, now()->diffInSeconds($challenge->otp_expires_at, false)),
        ];
    }

    public function findUserChallenge(object $user, int $challengeId): ?SysTwoFactorChallenge
    {
        return SysTwoFactorChallenge::query()
            ->where('id', $challengeId)
            ->where('id_user', $user->id_user)
            ->whereNull('deleted_at')
            ->first();
    }

    public function findChallengeById(int $challengeId): ?SysTwoFactorChallenge
    {
        return SysTwoFactorChallenge::query()
            ->where('id', $challengeId)
            ->whereNull('deleted_at')
            ->first();
    }

    public function userForChallenge(SysTwoFactorChallenge $challenge): SysUser
    {
        $user = SysUser::query()
            ->where('id_user', $challenge->id_user)
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            throw new \RuntimeException('User challenge 2FA tidak ditemukan.');
        }

        return $user;
    }

    private function generateChallenge(
        Request $request,
        object $user,
        array $contextPayload,
        int $resendCount = 0,
        ?SysTwoFactorChallenge $challenge = null
    ): array {
        $otp = (string) random_int(100000, 999999);
        $expiresAt = now()->addSeconds($this->otpExpireSeconds());

        $attributes = [
            'id_user' => $user->id_user,
            'id_group' => $contextPayload['id_group'] ?? null,
            'challenge_type' => 'email_otp',
            'delivery_channel' => 'email',
            'destination' => (string) ($user->email ?? ''),
            'otp_hash' => Hash::make($otp),
            'otp_expires_at' => $expiresAt,
            'attempt_count' => 0,
            'max_attempt' => $this->maxAttempts(),
            'resend_count' => $resendCount,
            'last_sent_at' => now(),
            'verified_at' => null,
            'context_payload' => $contextPayload,
            'created_from_ip' => $request->ip(),
            'created_from_agent' => substr((string) $request->userAgent(), 0, 1000),
        ];

        if ($challenge) {
            $challenge->forceFill($attributes)->save();

            return [$otp, $challenge];
        }

        $challenge = SysTwoFactorChallenge::query()->create($attributes);

        return [$otp, $challenge];
    }

    private function sendOtpEmail(object $user, string $otp, Carbon $expiresAt): void
    {
        $emailAddress = $this->otpDestination($user);
        $this->assertOtpMailerConfigured($emailAddress);

        $body = sprintf(
            'Kode OTP login E-Office Anda adalah <strong style="font-size:22px; letter-spacing:4px;">%s</strong><br><br>Kode berlaku sampai %s. Jika Anda tidak merasa melakukan login, abaikan email ini.',
            $otp,
            $expiresAt->format('d-m-Y H:i:s')
        );

        $payload = [
            'title' => 'Kode OTP Login E-Office',
            'body' => $body,
            'url' => config('security.admin_2fa_login_url'),
        ];

        try {
            Mail::to($emailAddress)->send(new Email($payload));
        } catch (\Throwable $exception) {
            Log::error('Gagal kirim email OTP 2FA', [
                'message' => $exception->getMessage(),
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.' . config('mail.default') . '.host'),
                'recipient' => $this->maskEmail($emailAddress),
            ]);

            throw new \RuntimeException('Gagal mengirim email OTP. Periksa konfigurasi SMTP backend.');
        }
    }

    private function assertOtpDeliveryReady(object $user): void
    {
        $this->assertOtpMailerConfigured($this->otpDestination($user));
    }

    private function otpDestination(object $user): string
    {
        $emailAddress = trim((string) ($user->email ?? ''));

        if ($emailAddress === '' || !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('Email user tidak valid untuk pengiriman OTP.');
        }

        return $emailAddress;
    }

    private function assertOtpMailerConfigured(string $emailAddress): void
    {
        $mailer = (string) config('mail.default');
        $mailerConfig = (array) config("mail.mailers.{$mailer}", []);
        $transport = (string) ($mailerConfig['transport'] ?? $mailer);

        if ($transport !== 'smtp') {
            Log::warning('Mailer OTP belum menggunakan SMTP', [
                'mailer' => $mailer,
                'transport' => $transport,
                'recipient' => $this->maskEmail($emailAddress),
            ]);

            throw new \RuntimeException('Konfigurasi email OTP belum menggunakan SMTP. Set MAIL_MAILER=smtp.');
        }

        $missing = [];
        foreach ([
            'MAIL_HOST' => $mailerConfig['host'] ?? null,
            'MAIL_PORT' => $mailerConfig['port'] ?? null,
            'MAIL_USERNAME' => $mailerConfig['username'] ?? null,
            'MAIL_PASSWORD' => $mailerConfig['password'] ?? null,
            'MAIL_FROM_ADDRESS' => config('mail.from.address'),
            'MAIL_FROM_NAME' => config('mail.from.name'),
        ] as $key => $value) {
            if ($value === null || trim((string) $value) === '') {
                $missing[] = $key;
            }
        }

        if ($missing) {
            Log::warning('Konfigurasi SMTP OTP belum lengkap', [
                'missing' => $missing,
                'mailer' => $mailer,
                'recipient' => $this->maskEmail($emailAddress),
            ]);

            throw new \RuntimeException('Konfigurasi SMTP OTP belum lengkap: ' . implode(', ', $missing) . '.');
        }

        $host = strtolower((string) ($mailerConfig['host'] ?? ''));
        $password = preg_replace('/\s+/', '', (string) ($mailerConfig['password'] ?? ''));
        if (str_contains($host, 'gmail') && strlen($password) < 16) {
            Log::warning('SMTP Gmail untuk OTP kemungkinan belum memakai App Password.', [
                'host' => $mailerConfig['host'] ?? null,
                'recipient' => $this->maskEmail($emailAddress),
            ]);
        }
    }

    private function deliveryStateAttributes(SysTwoFactorChallenge $challenge): array
    {
        return [
            'challenge_type' => $challenge->challenge_type,
            'delivery_channel' => $challenge->delivery_channel,
            'destination' => $challenge->destination,
            'otp_hash' => $challenge->otp_hash,
            'otp_expires_at' => $challenge->otp_expires_at,
            'attempt_count' => $challenge->attempt_count,
            'max_attempt' => $challenge->max_attempt,
            'resend_count' => $challenge->resend_count,
            'last_sent_at' => $challenge->last_sent_at,
            'verified_at' => $challenge->verified_at,
            'context_payload' => $challenge->context_payload,
            'created_from_ip' => $challenge->created_from_ip,
            'created_from_agent' => $challenge->created_from_agent,
            'updated_at' => $challenge->updated_at,
            'deleted_at' => $challenge->deleted_at,
        ];
    }

    private function invalidatePendingChallenges(int $userId, ?int $groupId = null): void
    {
        $query = SysTwoFactorChallenge::query()
            ->where('id_user', $userId)
            ->whereNull('verified_at')
            ->whereNull('deleted_at');

        if ($groupId) {
            $query->where('id_group', $groupId);
        }

        $query->update([
            'deleted_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function otpExpireSeconds(): int
    {
        return max(60, (int) config('security.admin_2fa_otp_expire_seconds', 300));
    }

    private function maxAttempts(): int
    {
        return max(1, (int) config('security.admin_2fa_max_attempts', 5));
    }

    private function maxResends(): int
    {
        return max(0, (int) config('security.admin_2fa_max_resends', 3));
    }

    private function maskEmail(string $email): string
    {
        if (!str_contains($email, '@')) {
            return $email;
        }

        [$username, $domain] = explode('@', $email, 2);
        $prefix = substr($username, 0, 1);
        $suffix = strlen($username) > 1 ? substr($username, -1) : '';

        return $prefix . str_repeat('*', max(1, strlen($username) - 2)) . $suffix . '@' . $domain;
    }
}
