<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Transbank\OrderStockReservation;
use App\Services\Transbank\TransbankOrderReconciler;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireTransbankOrders extends Command
{
    protected $signature = 'orders:expire-transbank';

    protected $description = 'Release inventory reserved by expired pending-payment orders';

    public function handle(
        TransbankOrderReconciler $reconciler,
        OrderStockReservation $stockReservation,
    ): int
    {
        Order::query()
            ->where('sale_source', 'online')
            ->where('status', 'pending_payment')
            ->where('created_at', '<=', now()->subDays(3))
            ->select(['id'])
            ->chunkById(100, function ($orders) use ($stockReservation) {
                foreach ($orders as $order) {
                    DB::transaction(function () use ($order, $stockReservation) {
                        $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

                        if ($lockedOrder
                            && $lockedOrder->sale_source === 'online'
                            && $lockedOrder->status === 'pending_payment'
                            && $lockedOrder->created_at <= now()->subDays(3)) {
                            $stockReservation->cancel($lockedOrder);
                        }
                    });
                }
            });

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
