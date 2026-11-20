<?php

namespace App\Mail;

use App\Models\QuoteRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class QuoteMail extends Mailable
{
    public function __construct(public readonly QuoteRequest $quoteRequest)
    {
        $this->quoteRequest->loadMissing('items');
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Tu cotización {$this->quoteRequest->number}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.quote');
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdf(), "cotizacion-{$this->quoteRequest->number}.pdf")
                ->withMime('application/pdf'),
        ];
    }

    public function pdf(): string
    {
        return Pdf::loadView('pdf.quote', [
            'quote' => $this->quoteRequest,
            'validityDays' => (int) config('services.quotes.validity_days', 3),
        ])->setPaper('a4')->output();
    }
}
