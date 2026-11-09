<?php

namespace App\Services\Transbank;

use App\Models\Order;

class OrderStockReservation
{
    public function release(Order $order): void
    {
        foreach ($order->items()->with('product')->get() as $item) {
            $item->product?->increment('stock', $item->quantity);
        }
    }

    public function expire(Order $order): void
    {
        $this->release($order);
        $order->update(['status' => 'payment_expired']);
    }
}
