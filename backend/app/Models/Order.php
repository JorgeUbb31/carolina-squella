<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_address',
        'delivery_city',
        'delivery_region',
        'payment_method',
        'status',
        'cart_token',
        'subtotal',
        'shipping_total',
        'total',
        'transbank_token',
        'transbank_buy_order',
        'transbank_session_id',
        'transbank_authorization_code',
        'paid_at',
        'payment_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping_total' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_at' => 'datetime',
            'payment_expires_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
