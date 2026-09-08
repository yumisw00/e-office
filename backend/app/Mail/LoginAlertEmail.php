<?php

namespace App\Mail;

use App\Models\SysUser;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LoginAlertEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $attempts;
    public $ip;
    public $time;

    public function __construct(SysUser $user, int $attempts)
    {
        $this->user = $user;
        $this->attempts = $attempts;
        $this->ip = request()->ip() ?? 'Unknown';
        $this->time = now()->format('d/m/Y H:i:s');
    }

    public function build()
    {
        return $this->subject('Peringatan Keamanan - Percobaan Login Gagal')
            ->view('emails.login-alert');
    }
}