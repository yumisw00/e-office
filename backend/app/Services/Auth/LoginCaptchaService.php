<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class LoginCaptchaService
{
    private const CACHE_PREFIX = 'login_captcha:';
    private const VALID_ANSWER = 'checked';

    public function create(): array
    {
        $token = Str::random(64);
        $expiresIn = (int) env('LOGIN_CAPTCHA_TTL_SECONDS', 300);

        try {
            $this->cache()->put($this->cacheKey($token), [
                'answer' => self::VALID_ANSWER,
                'created_at' => now()->format('Y-m-d H:i:s'),
            ], now()->addSeconds($expiresIn));
        } catch (\Throwable $e) {
            \Log::warning('Cache put failed in LoginCaptchaService::create', [
                'token' => $token,
                'error' => $e->getMessage(),
            ]);
            // Continue anyway - token is still valid
        }

        return [
            'captcha_token' => $token,
            'expires_in' => $expiresIn,
        ];
    }

    public function consume(?string $token, ?string $answer): bool
    {
        if (!$token || !$answer) {
            return false;
        }

        $payload = $this->cache()->pull($this->cacheKey($token));

        if (!is_array($payload)) {
            return false;
        }

        return hash_equals((string) ($payload['answer'] ?? ''), (string) $answer);
    }

    private function cacheKey(string $token): string
    {
        return self::CACHE_PREFIX . $token;
    }

    private function cache()
    {
        return Cache::store(config('cache.default') ?: 'file');
    }
}
