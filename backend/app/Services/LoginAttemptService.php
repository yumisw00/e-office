<?php

namespace App\Services;

use App\Mail\LoginAlertEmail;
use App\Mail\AdminAlertEmail;
use App\Models\LoginAttempt;
use App\Models\SysLog;
use App\Models\SysUserGroup;
use App\Models\SysUser;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class LoginAttemptService
{
    protected $maxAttempts;
    protected $lockoutDuration;

    public function __construct()
    {
        $this->maxAttempts = config('security.login_max_attempts', 5);
        $this->lockoutDuration = config('security.login_lockout_duration', 30);
    }

    /**
     * Record failed login attempt
     */
    public function recordFailedAttempt(string $email, string $ip = null): array
    {
        $ip = $ip ?? request()->ip();

        // Get user if exists
        $user = \App\Models\SysUser::where('email', $email)->first();

        // Update sys_user failed attempts
        if ($user) {
            $user->failed_login_attempts = ($user->failed_login_attempts ?? 0) + 1;
            $user->save();

            // Check if should lock
            if ($user->failed_login_attempts >= $this->maxAttempts) {
                $user->locked_until = now()->addMinutes($this->lockoutDuration);
                $user->need_update_pass = true;
                $user->reason_reset_pass = 'Terlalu banyak percobaan login gagal';
                $user->security_incident_flag = true;
                $user->save();

                // Log security incident
                $this->logSecurityIncident($user, 'Terlalu banyak percobaan login gagal');

                // Send alert to user
                $this->sendLoginAlertEmail($user, $user->failed_login_attempts);

                // Notify admin
                $this->notifyAdmin($user, $user->failed_login_attempts);
            }
        }

        // Update login_attempts table
        $attempt = LoginAttempt::getAttempt($ip, $email);
        $attempt->incrementAttempt();

        if ($attempt->attempt_count >= $this->maxAttempts) {
            $attempt->lock($this->lockoutDuration);
        }

        // Log to sys_log
        $this->logLoginAttempt($user, 'failed', $email, $ip);

        return [
            'attempts' => $user ? $user->failed_login_attempts : $attempt->attempt_count,
            'locked' => $user && $user->locked_until ? \Carbon\Carbon::parse($user->locked_until)->isFuture() : $attempt->isLocked(),
            'locked_until' => $user ? $user->locked_until : $attempt->locked_until,
        ];
    }

    /**
     * Record successful login (manual from controller)
     */
    public function recordSuccessLoginManual($user): void
    {
        return;
        if (!$user) return;
        
        // Reset failed attempts on user
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        // Update last login
        $user->last_login = now();
        $user->last_ip = request()->ip();
        $user->save();

        // Reset login attempts table
        if (request()) {
            $attempt = LoginAttempt::getAttempt(request()->ip(), $user->email);
            $attempt->resetAttempt();
        }

        // Log to sys_log
        $this->logLoginAttempt($user, 'success', $user->email);
    }

    /**
     * Get failed attempts count
     */
    public function getFailedAttempts(string $email): int
    {
        $user = SysUser::where('email', $email)->first();
        return $user ? $user->failed_login_attempts : 0;
    }

    /**
     * Check if account is locked
     */
    public function isAccountLocked(string $email): bool
    {
        $user = \App\Models\SysUser::where('email', $email)->first();

        if (!$user) {
            // Check IP-based locking
            $attempt = LoginAttempt::getAttempt(request()->ip(), $email);
            return $attempt->isLocked();
        }

        // Check using locked_until column
        return $user->locked_until && \Carbon\Carbon::parse($user->locked_until)->isFuture();
    }

    /**
     * Send alert email to user
     */
    public function sendLoginAlertEmail($user, int $attempts): void
    {
        try {
            Mail::to($user->email)->send(new LoginAlertEmail($user, $attempts));
        } catch (\Exception $e) {
            Log::error('Failed to send login alert email: ' . $e->getMessage());
        }
    }

    /**
     * Notify admin
     */
    public function notifyAdmin($user, int $attempts): void
    {
        try {
            // Get admin emails
            $adminEmails = $this->getAdminEmails();

            if (!empty($adminEmails)) {
                foreach ($adminEmails as $email) {
                    Mail::to($email)->send(new AdminAlertEmail($user, $attempts));
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send admin notification: ' . $e->getMessage());
        }
    }

    /**
     * Get admin emails
     */
    protected function getAdminEmails(): array
    {
        // Get users with admin role (id_group = 1)
        return SysUserGroup::where('id_group', 1)
            ->whereNull('deleted_at')
            ->with('sysUser')
            ->get()
            ->pluck('sysUser.email')
            ->filter()
            ->toArray();
    }

    /**
     * Log to sys_log
     */
    protected function logLoginAttempt($user, string $type, string $email, string $ip = null): void
    {
        $action = $type === 'success'
            ? SysLog::ACTION_LOGIN_SUCCESS
            : SysLog::ACTION_LOGIN_FAILED;

        $activity = $type === 'success'
            ? "Login berhasil untuk {$email}"
            : "Login gagal untuk {$email}";

        SysLog::logLoginAttempt([
            'action' => $action,
            'activity' => $activity,
            'ip' => $ip ?? request()->ip(),
            'user_agent' => request()->userAgent(),
            'user_desc' => $user ? $user->name : $email,
            'login_device' => $this->getDeviceInfo()['device'],
            'login_os' => $this->getDeviceInfo()['os'],
            'login_browser' => $this->getDeviceInfo()['browser'],
            'data' => [
                'email' => $email,
                'attempt_type' => $type,
            ],
        ]);
    }

    /**
     * Log security incident
     */
    protected function logSecurityIncident($user, string $reason): void
    {
        if (!$user) return;
        
        SysLog::logLoginAttempt([
            'action' => SysLog::ACTION_SECURITY_INCIDENT,
            'activity' => "Insiden keamanan: {$reason}",
            'ip' => request()->ip(),
            'user_desc' => $user->name,
            'data' => [
                'user_id' => $user->id_user,
                'email' => $user->email,
                'reason' => $reason,
            ],
        ]);
    }

    /**
     * Get device info
     */
    protected function getDeviceInfo(): array
    {
        $userAgent = request()->userAgent();

        // Simple browser detection
        $browser = 'Unknown';
        if (strpos($userAgent, 'Chrome') !== false) $browser = 'Chrome';
        elseif (strpos($userAgent, 'Firefox') !== false) $browser = 'Firefox';
        elseif (strpos($userAgent, 'Safari') !== false) $browser = 'Safari';
        elseif (strpos($userAgent, 'Edge') !== false) $browser = 'Edge';

        // Simple OS detection
        $os = 'Unknown';
        if (strpos($userAgent, 'Windows') !== false) $os = 'Windows';
        elseif (strpos($userAgent, 'Mac') !== false) $os = 'macOS';
        elseif (strpos($userAgent, 'Linux') !== false) $os = 'Linux';
        elseif (strpos($userAgent, 'Android') !== false) $os = 'Android';
        elseif (strpos($userAgent, 'iPhone') !== false) $os = 'iOS';

        return [
            'device' => 'Desktop',
            'os' => $os,
            'browser' => $browser,
        ];
    }
}