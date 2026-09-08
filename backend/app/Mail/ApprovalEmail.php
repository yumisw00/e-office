<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApprovalEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $greeting;
    public string $body;
    public ?string $actionText;
    public ?string $actionUrl;
    public array $detailRows;
    public ?string $footerNote;
    private string $mailSubject;

    /**
     * @param string $subject
     * @param string $greeting
     * @param string $body
     * @param array $detailRows  [['label' => string, 'value' => string]]
     * @param string|null $actionText
     * @param string|null $actionUrl
     * @param string|null $footerNote
     */
    public function __construct(
        string $subject,
        string $greeting,
        string $body,
        array $detailRows = [],
        ?string $actionText = null,
        ?string $actionUrl = null,
        ?string $footerNote = null,
    ) {
        $this->mailSubject = $subject;
        $this->greeting = $greeting;
        $this->body = $body;
        $this->detailRows = $detailRows;
        $this->actionText = $actionText;
        $this->actionUrl = $actionUrl;
        $this->footerNote = $footerNote;
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.approval-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
