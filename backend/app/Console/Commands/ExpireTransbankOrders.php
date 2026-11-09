<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Transbank\OrderStockReservation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireTransbankOrders extends Command
{
    protected $signature = 'orders:expire-transbank';

    protected $description = 'Release inventory reserved by expired Webpay Plus orders';

    public function handle(): int
    {
        Order::query()
            ->where('payment_method', 'webpay_plus')
            ->where('status', 'pending_payment')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<=', now())
            ->select('id')
            ->chunkById(100, function ($orders) {
                foreach ($orders as $order) {
                    DB::transaction(function () use ($order) {
                        $lockedOrder = Order::query()->lockForUpdate()->find($order->id);
                        if (! $lockedOrder
                            || $lockedOrder->status !== 'pending_payment'
                            || $lockedOrder->payment_expires_at?->isFuture()) {
                            return;
                        }

                        app(OrderStockReservation::class)->expire($lockedOrder);
                    });
                }
            });

        return self::SUCCESS;
    }
}
