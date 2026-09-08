<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'material',
        'color',
        'pattern',
        'width_cm',
        'height_cm',
        'is_blackout',
        'is_thermal',
        'is_waterproof',
        'sample_available',
        'unit_type',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'width_cm' => 'integer',
            'height_cm' => 'integer',
            'is_blackout' => 'boolean',
            'is_thermal' => 'boolean',
            'is_waterproof' => 'boolean',
            'sample_available' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
