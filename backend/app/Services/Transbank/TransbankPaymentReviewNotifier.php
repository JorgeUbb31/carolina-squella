<?php

namespace App\Services\Transbank;

use App\Models\Order;
use App\Notifications\TransbankPaymentReviewNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class TransbankPaymentReviewNotifier
{
    public function notify(Order $order, array $payment): void
    {
        $recipient = config('services.transbank.payment_review_alert_email');
        if (! is_string($recipient) || trim($recipient) === '') {
            Log::error('No se pudo enviar la alerta de revisión de pago: PAYMENT_REVIEW_ALERT_EMAIL no está configurado.', [
                'order_id' => $order->id,
            ]);

            return;
        }

        DB::afterCommit(function () use ($order, $payment, $recipient) {
            Notification::route('mail', $recipient)->notify(
                new TransbankPaymentReviewNotification(
                    $order->order_number,
                    $order->id,
                    $payment,
                ),
            );
        });
    }
}
