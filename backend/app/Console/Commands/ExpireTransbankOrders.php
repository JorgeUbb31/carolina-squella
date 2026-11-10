<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Transbank\TransbankOrderReconciler;
use Illuminate\Console\Command;

class ExpireTransbankOrders extends Command
{
    protected $signature = 'orders:expire-transbank';

    protected $description = 'Release inventory reserved by expired pending-payment orders';

    public function handle(TransbankOrderReconciler $reconciler): int
    {
        Order::query()
            ->whereIn('payment_method', ['webpay_plus', 'bank_transfer'])
            ->where('status', 'pending_payment')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<=', now())
            ->select(['id', 'payment_method', 'transbank_token', 'payment_expires_at'])
            ->chunkById(100, function ($orders) use ($reconciler) {
                foreach ($orders as $order) {
                    if ($order->payment_method === 'webpay_plus') {
                        $reconciler->reconcile($order, expireIfUnapproved: true);
                        continue;
                    }

                    $reconciler->expireBankTransfer($order);
                }
            });

        return self::SUCCESS;
    }
}
