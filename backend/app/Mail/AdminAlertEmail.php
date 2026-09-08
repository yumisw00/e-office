<?php

namespace App\Mail;

use App\Models\SysUserModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminAlertEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $attempts;
    public $ip;
    public $time;

    public function __construct(SysUserModel $user, int $attempts)
    {
        $this->user = $user;
        $this->attempts = $attempts;
        $this->ip = request()->ip() ?? 'Unknown';
        $this->time = now()->format('d/m/Y H:i:s');
    }

    public function build()
    {
        return $this->subject('[ADMIN] Alert: Percobaan Login Gagal Berlebihan')
            ->view('emails.admin-alert');
    }
}