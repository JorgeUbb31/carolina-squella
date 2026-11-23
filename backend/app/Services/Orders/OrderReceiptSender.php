<?php

namespace App\Services\Orders;

use App\Mail\OrderReceiptMail;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OrderReceiptSender
{
    private const CLAIM_TIMEOUT_MINUTES = 10;

    public function sendIfPaid(int $orderId): void
    {
        $order = DB::transaction(function () use ($orderId) {
            $order = Order::query()->lockForUpdate()->find($orderId);

            if (! $order
                || $order->status !== 'paid'
                || $order->payment_method !== 'webpay_plus'
                || $order->receipt_email_sent_at) {
                return null;
            }

            if ($order->receipt_email_claimed_at?->isAfter(now()->subMinutes(self::CLAIM_TIMEOUT_MINUTES))) {
                return null;
            }

            $order->update(['receipt_email_claimed_at' => now()]);

            return $order->load('items');
        });

        if (! $order) {
            return;
        }

        if (config('mail.default') === 'log') {
            $order->update(['receipt_email_claimed_at' => null]);
            Log::warning('No se envió el comprobante porque el mailer log no entrega correos.', [
                'order_id' => $order->id,
            ]);

            return;
        }

        try {
            Mail::to($order->customer_email)->send(new OrderReceiptMail($order));

            $order->update([
                'receipt_email_sent_at' => now(),
                'receipt_email_claimed_at' => null,
            ]);
        } catch (Throwable $exception) {
            $order->update(['receipt_email_claimed_at' => null]);

            Log::error('No se pudo enviar el comprobante de compra por correo.', [
                'order_id' => $order->id,
                'exception' => $exception,
            ]);
        }
    }
}
