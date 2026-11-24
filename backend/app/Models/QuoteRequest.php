<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuoteRequest extends Model
{
    protected $appends = ['number'];

    protected $fillable = [
        'name',
        'email',
        'phone',
        'details',
        'status',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteRequestItem::class);
    }

    public function getNumberAttribute(): string
    {
        return 'COT-'.str_pad((string) $this->id, 6, '0', STR_PAD_LEFT);
    }
}
