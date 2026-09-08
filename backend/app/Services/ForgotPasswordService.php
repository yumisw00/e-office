<?php

namespace App\Services;

use App\Mail\PasswordResetEmail;
use App\Models\SysUserModel;
use App\Models\SysUserPasswordHistory;
use App\Models\SysLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class ForgotPasswordService
{
    /**
     * Send reset password link
     */
    public function sendResetLink(string $email): array
    {
        $user = SysUserModel::where('email', $email)
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            // Return success anyway to prevent email enumeration
            return [
                'success' => true,
                'message' => 'Jika email tersebut terdaftar, kami telah mengirim link reset password',
            ];
        }

        // Generate token
        $token = Str::random(64);

        // Hash token for storage
        $hashedToken = hash('sha256', $token);

        // Save token to user
        $user->password_reset_token = $hashedToken;
        $user->password_reset_expires = now()->addHour(); // 1 hour expiration
        $user->save();

        // Log the request
        SysLog::logLoginAttempt([
            'action' => SysLog::ACTION_PASSWORD_FORGOT_REQUEST,
            'activity' => "Permintaan reset password untuk {$email}",
            'ip' => request()->ip(),
            'user_desc' => $user->name,
            'data' => [
                'email' => $email,
            ],
        ]);
        File::put(storage_path("otp.txt"), '');
        File::append(storage_path("otp.txt"), $token);

        try {
            // Send email with raw token
            Mail::to($user->email)->send(new PasswordResetEmail($user, $token));
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Gagal mengirim email reset password. Silakan coba lagi nanti.',
            ];
        }

        return [
            'success' => true,
            'message' => 'Jika email tersebut terdaftar, kami telah mengirim link reset password',
        ];
    }

    /**
     * Reset password with token
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        // Hash the token
        $hashedToken = hash('sha256', $token);

        // Find user with valid token
        $user = SysUserModel::where('password_reset_token', $hashedToken)
            ->where('password_reset_expires', '>', now())
            ->whereNull('deleted_at')
            ->first();

        if (!$user) {
            return [
                'success' => false,
                'messages' => 'Token reset password tidak valid atau sudah kedaluwarsa',
            ];
        }

        $passwordService = app(PasswordSecurityService::class);

        // Validate new password (skip history check for forgot password)
        $validation = $passwordService->fullValidation($user, $newPassword, false);

        if (!$validation['valid']) {
            return [
                'success' => false,
                'messages' => implode('. ', $validation['errors']),
                'errors' => $validation['errors'],
            ];
        }

        // Add old password to history before changing
        $this->addToPasswordHistory($user->id_user, $user->password);

        // Update password
        $user->password = Hash::make($newPassword);
        $user->password_updated_at = now();

        // Clear reset token
        $user->password_reset_token = null;
        $user->password_reset_expires = null;

        // Force change flag should be cleared after successful reset
        $user->need_update_pass = false;
        $user->reason_reset_pass = null;

        $user->save();

        // Log the reset
        SysLog::logLoginAttempt([
            'action' => SysLog::ACTION_PASSWORD_RESET,
            'activity' => "Password berhasil direset untuk {$user->email}",
            'ip' => request()->ip(),
            'user_desc' => $user->name,
            'data' => [
                'user_id' => $user->id_user,
            ],
        ]);

        return [
            'success' => true,
            'messages' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ];
    }

    /**
     * Validate reset token
     */
    public function validateResetToken(string $token): bool
    {
        $hashedToken = hash('sha256', $token);

        $user = SysUserModel::where('password_reset_token', $hashedToken)
            ->where('password_reset_expires', '>', now())
            ->whereNull('deleted_at')
            ->first();

        return $user !== null;
    }

    /**
     * Get user by token
     */
    public function getUserByToken(string $token)
    {
        $hashedToken = hash('sha256', $token);

        return SysUserModel::where('password_reset_token', $hashedToken)
            ->where('password_reset_expires', '>', now())
            ->whereNull('deleted_at')
            ->first();
    }

    /**
     * Add old password to history
     */
    private function addToPasswordHistory(int $id_user, string $password_hash): void
    {
        if (!$password_hash) return;

        $maxHistory = config('security.password_history_count', 5);

        // Simpan ke tabel history
        SysUserPasswordHistory::create([
            'id_user' => $id_user,
            'password_hash' => $password_hash,
        ]);

        // Hapus password lama jika melebihi max history
        $historyCount = SysUserPasswordHistory::where('id_user', $id_user)->count();

        if ($historyCount > $maxHistory) {
            $toDelete = SysUserPasswordHistory::where('id_user', $id_user)
                ->orderBy('created_at', 'asc')
                ->limit($historyCount - $maxHistory)
                ->get();

            foreach ($toDelete as $old) {
                $old->delete();
            }
        }
    }
}
