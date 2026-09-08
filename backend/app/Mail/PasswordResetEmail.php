<?php

namespace App\Mail;

use App\Models\SysUserModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;

    public function __construct(SysUserModel $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
    }

    public function build()
    {
        // Gunakan URL frontend untuk reset password
        $frontendUrl = config('app.frontend_url', 'http://192.168.0.41:5173');
        $resetUrl = $frontendUrl . '/password-reset?token=' . $this->token;
        
        return $this->subject('Reset Password - ICOFR')
            ->view('emails.password-reset', ['resetUrl' => $resetUrl]);
    }
}