<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class SuratKeluarTerkirimEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public object $surat,
        public ?object $signature,
        public ?string $attachmentPath,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Surat Keluar: ' . ($this->surat->perihal ?: ($this->surat->nomor_surat ?: $this->surat->kode_draft ?: 'Dokumen')),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.surat-keluar-terkirim',
            with: [
                'surat' => $this->surat,
                'signature' => $this->signature,
                'attachmentPath' => $this->attachmentPath,
            ],
        );
    }

    public function attachments(): array
    {
        if (!$this->attachmentPath || !Storage::exists($this->attachmentPath)) {
            return [];
        }

        $absolutePath = Storage::path($this->attachmentPath);
        $fileName = basename($this->attachmentPath);
        $mime = match (strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc' => 'application/msword',
            default => 'application/octet-stream',
        };

        return [
            Attachment::fromPath($absolutePath)
                ->as($fileName)
                ->withMime($mime),
        ];
    }
}
