<?php

namespace App\Mail;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OrderReceiptMail extends Mailable
{
    public function __construct(public readonly Order $order)
    {
        $this->order->loadMissing('items');
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Comprobante de compra {$this->order->order_number}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.order-receipt');
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => $this->pdf(),
                "comprobante-{$this->order->order_number}.pdf",
            )->withMime('application/pdf'),
        ];
    }

    public function pdf(): string
    {
        return Pdf::loadView('pdf.order-receipt', ['order' => $this->order])
            ->setPaper('a4')
            ->output();
    }
}
