<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TransbankPaymentReviewNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $orderNumber,
        private readonly int $orderId,
        private readonly array $payment,
    ) {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Acción requerida: pago Webpay en revisión')
            ->greeting('Se requiere revisar un pago Webpay.')
            ->line("Orden: {$this->orderNumber} (ID {$this->orderId})")
            ->line('Estado Transbank: '.($this->payment['status'] ?? 'desconocido'))
            ->line('Código de respuesta: '.($this->payment['response_code'] ?? 'no informado'))
            ->line('Monto informado: '.($this->payment['amount'] ?? 'no informado'))
            ->line('Buy order: '.($this->payment['buy_order'] ?? 'no informado'))
            ->line('Session ID: '.($this->payment['session_id'] ?? 'no informado'))
            ->line('La orden conserva el stock reservado y requiere revisión manual.');
    }
}
