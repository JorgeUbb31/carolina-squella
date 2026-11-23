<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Orders\OrderReceiptSender;
use Illuminate\Console\Command;

class SendPaidOrderReceipts extends Command
{
    protected $signature = 'orders:send-paid-receipts';

    protected $description = 'Send purchase receipts for paid Webpay Plus orders';

    public function handle(OrderReceiptSender $receiptSender): int
    {
        Order::query()
            ->where('payment_method', 'webpay_plus')
            ->where('status', 'paid')
            ->whereNull('receipt_email_sent_at')
            ->where(function ($query) {
                $query->whereNull('receipt_email_claimed_at')
                    ->orWhere('receipt_email_claimed_at', '<=', now()->subMinutes(10));
            })
            ->select(['id'])
            ->chunkById(100, function ($orders) use ($receiptSender) {
                foreach ($orders as $order) {
                    $receiptSender->sendIfPaid($order->id);
                }
            });

        return self::SUCCESS;
    }
}
