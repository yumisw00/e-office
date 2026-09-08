<?php

namespace App\Http\Requests\Auth;

use App\Models\SysUserModel;
use App\Models\SysUser;
use App\Services\LoginAttemptService;
use App\Models\SysLog;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

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
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $email = $this->input('email');
        $password = $this->input('password');
        
        // Check if account is locked
        $loginAttemptService = app(LoginAttemptService::class);
        
        if ($loginAttemptService->isAccountLocked($email)) {
            RateLimiter::hit($this->throttleKey());
            
            // Log the attempt
            $this->logFailedAttempt($email, 'Account is locked');
            
            throw ValidationException::withMessages([
                'email' => 'Akun Anda dikunci karena terlalu banyak percobaan login gagal. Silakan coba lagi dalam 30 menit atau hubungi administrator.',
            ]);
        }

        $user = SysUserModel::where('email', $email)
            ->whereNull('deleted_at')
            ->first();
        $user_Auth = SysUser::where('email', $email)
            ->whereNull('deleted_at')
            ->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            RateLimiter::hit($this->throttleKey());
            
            // Record failed attempt
            $attemptResult = $loginAttemptService->recordFailedAttempt($email);
            
            // Log the attempt
            $this->logFailedAttempt($email, 'Invalid credentials');
            
            if ($attemptResult['locked']) {
                throw ValidationException::withMessages([
                    'email' => 'Akun Anda dikunci karena terlalu banyak percobaan login gagal. Silakan coba lagi dalam 30 menit atau hubungi administrator.',
                ]);
            }
            
            $remainingAttempts = $this->maxAttempts() - $attemptResult['attempts'];
            
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
                '_meta' => [
                    'remaining_attempts' => $remainingAttempts,
                    'attempts' => $attemptResult['attempts'],
                ]
            ]);
        }

        // Check if user is locked
        if ($user->isLockedOut()) {
            RateLimiter::hit($this->throttleKey());
            $this->logFailedAttempt($email, 'User locked');
            
            throw ValidationException::withMessages([
                'email' => 'Akun Anda dikunci. Silakan hubungi administrator.',
            ]);
        }

        // Check if password needs update (first login or security incident)
        if ($user->need_update_pass) {
            // Still allow login, but must change password
            // Record attempt
            $loginAttemptService->recordSuccessLogin($user);
            
            // Log success for force password change
            $this->logLoginAttempt($user, 'success_with_force');
            
            \Illuminate\Support\Facades\Auth::login($user_Auth, $this->boolean('remember'));
            RateLimiter::clear($this->throttleKey());
            return;
        }

        \Illuminate\Support\Facades\Auth::login($user_Auth, $this->boolean('remember'));
        
        // Record success
        $loginAttemptService->recordSuccessLogin($user);

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Log failed attempt to sys_log
     */
    protected function logFailedAttempt(string $email, string $reason): void
    {
        try {
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
            $action = $type === 'success' 
                ? SysLog::ACTION_LOGIN_SUCCESS 
                : SysLog::ACTION_FORCE_PASSWORD_CHANGE;
                
            $activity = $type === 'success'
                ? "Login berhasil untuk {$user->email}"
                : "Login berhasil - wajib ubah password ({$user->email})";

            $user->logging([
                'action' => $action,
                'activity' => $activity,
            ], true);
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
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
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