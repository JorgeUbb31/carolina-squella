<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Transbank\TransbankOrderReconciler;
use Illuminate\Console\Command;

class ReconcileTransbankOrders extends Command
{
    protected $signature = 'orders:reconcile-transbank';

    protected $description = 'Reconcile pending Webpay Plus payments with Transbank';

    public function handle(TransbankOrderReconciler $reconciler): int
    {
        Order::query()
            ->where('payment_method', 'webpay_plus')
            ->where('status', 'pending_payment')
            ->whereNotNull('transbank_token')
            ->where('created_at', '<=', now()->subMinutes(5))
            ->select(['id', 'transbank_token'])
            ->chunkById(100, function ($orders) use ($reconciler) {
                foreach ($orders as $order) {
                    $reconciler->reconcile($order);
                }
            });

        return self::SUCCESS;
    }
}
