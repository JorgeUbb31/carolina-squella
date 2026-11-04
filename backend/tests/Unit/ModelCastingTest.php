<?php

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

it('casts product prices, stock, and flags to their expected types', function () {
    $product = new Product([
        'price' => '18900',
        'stock' => '8',
        'is_active' => 1,
        'is_blackout' => 0,
    ]);

    expect($product->price)->toBe('18900.00')
        ->and($product->stock)->toBe(8)
        ->and($product->is_active)->toBeTrue()
        ->and($product->is_blackout)->toBeFalse();
});

it('casts admin status without allowing mass assignment of privileges', function () {
    $user = new User;
    $user->forceFill(['is_admin' => 1]);

    expect($user->is_admin)->toBeTrue()
        ->and($user->isFillable('is_admin'))->toBeFalse();
});

it('casts order totals to two-decimal monetary values', function () {
    $order = new Order([
        'subtotal' => '24000',
        'shipping_total' => '3500.5',
        'total' => '27500.5',
    ]);

    expect($order->subtotal)->toBe('24000.00')
        ->and($order->shipping_total)->toBe('3500.50')
        ->and($order->total)->toBe('27500.50');
});

it('casts cart item quantity to an integer', function () {
    $cartItem = new CartItem(['quantity' => '3']);

    expect($cartItem->quantity)->toBe(3);
});
