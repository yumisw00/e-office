<?php

namespace App\Http\Requests\Auth;

use App\Models\SysUser;
use App\Services\Auth\LoginCaptchaService;
use App\Services\LoginAttemptService;
use App\Models\SysLog;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'captcha_token' => ['required', 'string'],
            'captcha_answer' => ['required', 'string', 'in:checked'],
        ];
    }

    public function messages(): array
    {
        return [
            'captcha_token.required' => 'Centang captcha terlebih dahulu.',
            'captcha_answer.required' => 'Centang captcha terlebih dahulu.',
            'captcha_answer.in' => 'Centang captcha terlebih dahulu.',
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): SysUser
    {
        $this->ensureIsNotRateLimited();
        $this->validateCaptcha();

        $email = $this->input('email');
        $password = $this->input('password');

        // Check if account is locked via LoginAttemptService
        $loginAttemptService = app(LoginAttemptService::class);
        $lock_duration = config('security.login_lockout_duration', 30);

        if ($loginAttemptService->isAccountLocked($email)) {
            RateLimiter::hit($this->throttleKey());
            $this->logFailedAttempt($email, 'Account is locked');

            throw ValidationException::withMessages([
                'email' => 'Akun Anda dikunci karena terlalu banyak percobaan login gagal. Silakan coba lagi dalam ' . $lock_duration . ' menit atau hubungi administrator.',
            ]);
        }

        // Get user - Using SysUser for authentication
        $user = SysUser::where('email', $email)
            ->whereNull('deleted_at')
            ->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            RateLimiter::hit($this->throttleKey());

            // Record failed attempt
            $attemptResult = $loginAttemptService->recordFailedAttempt($email);

            // Log the attempt
            $this->logFailedAttempt($email, 'Invalid credentials');

            /*
            if ($attemptResult['locked']) {
                throw ValidationException::withMessages([
                    'email' => 'Akun Anda dikunci karena terlalu banyak percobaan login gagal. Silakan coba lagi dalam ' . $lock_duration . ' menit atau hubungi administrator.',
                ]);
            }
            */

            $remainingAttempts = $this->maxAttempts() - $attemptResult['attempts'];

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
                '_meta' => [
                    'remaining_attempts' => $remainingAttempts,
                    'attempts' => $attemptResult['attempts'],
                ]
            ]);
        }

        // Check if user is locked (using locked_until column)
        if ($user->locked_until && Carbon::parse($user->locked_until)->isFuture()) {
            RateLimiter::hit($this->throttleKey());
            $this->logFailedAttempt($email, 'User locked');

            throw ValidationException::withMessages([
                'email' => 'Akun Anda dikunci. Silakan hubungi administrator.',
            ]);
        }

        // Check if password needs update (first login or security incident)
        // Using need_update_pass column
        if ($user->need_update_pass == true || $user->need_update_pass === true) {
            RateLimiter::clear($this->throttleKey());

            return $user;
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    public function validateCaptcha(): void
    {
        $isValid = app(LoginCaptchaService::class)->consume(
            $this->input('captcha_token'),
            $this->input('captcha_answer')
        );

        if (!$isValid) {
            throw ValidationException::withMessages([
                'captcha_answer' => ['Centang captcha terlebih dahulu.'],
            ]);
        }
    }
    /**
     * Log failed attempt to sys_log
     */
    protected function logFailedAttempt(string $email, string $reason): void
    {
        try {
            /*
            SysLog::logLoginAttempt([
                'action' => SysLog::ACTION_LOGIN_FAILED,
                'activity' => "Login gagal: {$reason} - {$email}",
                'ip' => $this->ip(),
                'user_agent' => $this->userAgent(),
                'user_desc' => $email,
                'data' => [
                    'email' => $email,
                    'reason' => $reason,
                ],
            ]);
            */
            $sysusermodel = new \App\Models\SysUserModel();
            $sysusermodel->logging(
                array(
                    "action" => SysLog::ACTION_LOGIN_FAILED,
                    "table_name" => "sys_user",
                    "activity" => "Login gagal: {$reason} - {$email}",
                    'data' => [
                        'email' => $email,
                        'reason' => $reason,
                    ],
                )
            );
        } catch (\Exception $e) {
            Log::error('Failed to log login attempt: ' . $e->getMessage());
        }
    }

    /**
     * Log successful attempt
     */
    protected function logLoginAttempt($user, string $type): void
    {
        try {
            $sysusermodel = new \App\Models\SysUserModel();
            $action = $type === 'success'
                ? SysLog::ACTION_LOGIN_SUCCESS
                : SysLog::ACTION_FORCE_PASSWORD_CHANGE;

            $activity = $type === 'success'
                ? "Login berhasil untuk {$user->email}"
                : "Login berhasil - wajib ubah password ({$user->email})";

            /*
            SysLog::logLoginAttempt([
                'action' => $action,
                'activity' => $activity,
                'ip' => $this->ip(),
                'user_agent' => $this->userAgent(),
                'user_desc' => $user->name,
                'data' => [
                    'user_id' => $user->id_user,
                    'email' => $user->email,
                    'login_type' => $type,
                ],
            ]);
            */
            $sysusermodel->logging(
                array(
                    "action" => $action,
                    "table_name" => "sys_user",
                    "activity" => $activity,
                    'data' => [
                        'user_id' => $user->id_user,
                        'email' => $user->email,
                        'login_type' => $type,
                    ],
                )
            );
        } catch (\Exception $e) {
            Log::error('Failed to log login attempt: ' . $e->getMessage());
        }
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')) . '|' . $this->ip());
    }

    /**
     * Get max attempts
     */
    protected function maxAttempts(): int
    {
        return config('security.login_max_attempts', 5);
    }
}
