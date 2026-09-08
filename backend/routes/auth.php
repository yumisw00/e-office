<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\API\PasswordController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SAMLController;
use App\Jobs\Runing;

use App\Jobs\DokumenTooNewForm;
use App\Jobs\DokumenTooBatch;
use App\Jobs\DokumenToo;
use App\Jobs\AnalyzeTodBatch;
use App\Jobs\AnalyzeTodNewForm;
use App\Jobs\AnalyzeTod;
use App\Jobs\AnalyzeToe;
use App\Jobs\AnalyzeToeBatch;

use App\Models\Periode;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
// Route::post('/register', [RegisteredUserController::class, 'store'])
//                 ->middleware('guest')
//                 ->name('register');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest')
    ->name('login');

// Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
//                 ->middleware('guest')
//                 ->name('password.email');

// Route::post('/reset-password', [NewPasswordController::class, 'store'])
//                 ->middleware('guest')
//                 ->name('password.store');

Route::get('/login-captcha', [AuthenticatedSessionController::class, 'captcha'])
    ->middleware('guest')
    ->name('login.captcha');

// Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
//                 ->middleware(['auth', 'signed', 'throttle:6,1'])
//                 ->name('verification.verify');

// Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
//                 ->middleware(['auth', 'throttle:6,1'])
//                 ->name('verification.send');

Route::post('/choseGroup', [AuthenticatedSessionController::class, 'choseGroup'])
    ->middleware('guest')
    ->name('choseGroup');

Route::post('/2fa/verify', [AuthenticatedSessionController::class, 'verifyTwoFactor'])
    ->middleware('guest')
    ->name('2fa.verify');

Route::post('/2fa/resend', [AuthenticatedSessionController::class, 'resendTwoFactor'])
    ->middleware('guest')
    ->name('2fa.resend');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::get('/saml/login', [SAMLController::class, 'login']);
Route::post('/saml/acs', [SAMLController::class, 'acs'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

Route::post('/loginAs', [AuthenticatedSessionController::class, 'loginAs'])
    ->middleware('auth')
    ->name('loginAs');

Route::get('authenticate', [AuthenticatedSessionController::class, 'authenticate']);


// === PASSWORD SECURITY ROUTES ===
// Forgot Password
Route::post('/forgot-password', [PasswordController::class, 'sendResetLink'])
    ->middleware('guest')
    ->name('password.forgot');

// Reset Password
Route::get('/password-reset', [PasswordController::class, 'showResetPage'])
    ->middleware('guest')
    ->name('password.reset.page');

Route::post('/password-reset', [PasswordController::class, 'resetPassword'])
    ->middleware('guest')
    ->name('password.reset');

// Force Password Change (after login)
Route::middleware('auth')->group(function () {
    Route::get('/password/status', [PasswordController::class, 'getPasswordStatus'])
        ->name('password.status');
        
    Route::post('/password/update', [PasswordController::class, 'updatePassword'])
        ->name('password.update');
        
    Route::post('/password/check-strength', [PasswordController::class, 'checkPasswordStrength'])
        ->name('password.check-strength');
});
