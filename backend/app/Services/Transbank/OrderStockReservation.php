<?php

namespace App\Services\Transbank;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;

class OrderStockReservation
{
    public function release(Order $order, string $reason = 'payment_release'): void
    {
        foreach ($order->items()->with('product')->get() as $item) {
            $product = $item->product;
            if (! $product) {
                continue;
            }

            $stockBefore = (int) $product->stock;
            $product->increment('stock', $item->quantity);
            $stockAfter = $stockBefore + (int) $item->quantity;
            $this->recordStockMovement(
                $product,
                $item->quantity,
                $stockBefore,
                $stockAfter,
                $reason,
            );
        }
    }

    public function expire(Order $order): void
    {
        $this->release($order, 'payment_expired');
        $order->update(['status' => 'payment_expired']);
    }

    public function confirm(Order $order, array $payment): bool
    {
        $authorized = in_array($payment['status'] ?? null, ['AUTHORIZED', 'CAPTURED'], true)
            && ($payment['response_code'] ?? null) === 0;
        if (! $authorized) {
            return false;
        }

        $matchesOrder = (int) round((float) ($payment['amount'] ?? 0)) === (int) round((float) $order->total)
            && ($payment['buy_order'] ?? null) === $order->transbank_buy_order
            && ($payment['session_id'] ?? null) === $order->transbank_session_id;

        if (! $matchesOrder) {
            return false;
        }

        $order->update([
            'status' => 'paid',
            'paid_at' => now(),
            'transbank_authorization_code' => $payment['authorization_code'] ?? null,
        ]);
        Cart::query()
            ->where('token', $order->cart_token)
            ->first()
            ?->items()
            ->delete();

        return true;
    }

    private function recordStockMovement(
        Product $product,
        int $quantityChange,
        int $stockBefore,
        int $stockAfter,
        string $reason,
    ): void {
        $product->stockMovements()->create([
            'product_id' => $product->id,
            'quantity_change' => $quantityChange,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reason' => $reason,
        ]);
    }
}
