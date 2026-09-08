<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Services\ForgotPasswordService;
use App\Services\PasswordSecurityService;
use App\Models\SysUserModel;
use App\Models\SysLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class PasswordController extends AppBaseController
{
    protected $forgotPasswordService;
    protected $passwordSecurityService;

    public function __construct()
    {
        $this->forgotPasswordService = app(ForgotPasswordService::class);
        $this->passwordSecurityService = app(PasswordSecurityService::class);
    }

    /**
     * Send forgot password link
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $result = $this->forgotPasswordService->sendResetLink($request->email);

        return $this->respond([
            'message' => $result['message'],
        ], $result['success'] ? 200 : 400);
    }

    /**
     * Show reset password page (for frontend) - redirect to frontend
     */
    public function showResetPage(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return $this->failValidationError('Token tidak valid');
        }

        $user = $this->forgotPasswordService->getUserByToken($token);

        if (!$user) {
            return $this->failValidationError('Token tidak valid atau sudah kedaluwarsa');
        }

        // Redirect ke frontend dengan token
        $frontendUrl = config('app.frontend_url', 'http://192.168.0.41:5173');
        return redirect($frontendUrl . '/password-reset?token=' . $token . '&email=' . $user->email);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
        ]);

        $result = $this->forgotPasswordService->resetPassword(
            $request->token,
            $request->password
        );

        if (!$result['success']) {
            $result['error'] = 422;
            $result['status'] = 422;
            unset($result['success']);
            return $this->respond($result, 422);
            // return $this->failValidationError($result['message']);
            // return $this->failValidationError($result['message'], implode(", ", $result['errors']) ?? null);
        }

        return $this->respond([
            'message' => $result['message'],
        ]);
    }

    /**
     * Get password status
     */
    public function getPasswordStatus(Request $request)
    {
        $user = $request->user();

        return $this->respond([
            'need_update_pass' => (bool) $user->need_update_pass,
            'reason_reset_pass' => $user->reason_reset_pass,
            'password_updated_at' => $user->password_updated_at?->toIso8601String(),
            'security_incident_flag' => (bool) $user->security_incident_flag,
            'last_login' => $user->last_login?->toIso8601String(),
            'failed_login_attempts' => (int) $user->failed_login_attempts,
            'password_requirements' => $this->passwordSecurityService->generatePasswordRequirements(),
        ]);
    }

    /**
     * Update password (from profile or force)
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return $this->failValidationError('Password saat ini tidak cocok');
        }

        // Full validation
        $validation = $this->passwordSecurityService->fullValidation($user, $request->password, true);

        if (!$validation['valid']) {
            return $this->failValidationError(implode('. ', $validation['errors']), $validation['errors']);
        }

        // Add old password to history
        $user->addToPasswordHistory($user->password);

        // Update password
        $user->password = Hash::make($request->password);
        $user->password_updated_at = now();

        // Clear force password change flags
        if ($user->need_update_pass) {
            $user->clearForcePasswordChange();
        }

        // Reset failed attempts after successful password change from profile
        $user->resetFailedAttempts();

        $user->save();

        // Log the change
        SysLog::logLoginAttempt([
            'action' => SysLog::ACTION_PASSWORD_CHANGED,
            'activity' => "Password berhasil diubah untuk {$user->email}",
            'ip' => request()->ip(),
            'user_desc' => $user->name,
            'data' => [
                'user_id' => $user->id_user,
            ],
        ]);

        return $this->respond([
            'message' => 'Password berhasil diubah',
        ]);
    }

    /**
     * Check password strength (async validation)
     */
    public function checkPasswordStrength(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $result = $this->passwordSecurityService->validatePasswordStrength($request->password);

        return $this->respond($result);
    }
}
