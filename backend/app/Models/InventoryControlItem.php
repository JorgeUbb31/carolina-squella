<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryControlItem extends Model
{
    protected $fillable = [
        'inventory_control_id',
        'product_id',
        'product_name',
        'product_slug',
        'category_name',
        'unit_type',
        'system_stock_snapshot',
        'movement_id_snapshot',
        'counted_movement_id',
        'expected_stock',
        'counted_stock',
        'difference',
        'counted_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'system_stock_snapshot' => 'integer',
            'movement_id_snapshot' => 'integer',
            'counted_movement_id' => 'integer',
            'expected_stock' => 'integer',
            'counted_stock' => 'integer',
            'difference' => 'integer',
            'counted_at' => 'datetime',
        ];
    }

    public function control(): BelongsTo
    {
        return $this->belongsTo(InventoryControl::class, 'inventory_control_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
