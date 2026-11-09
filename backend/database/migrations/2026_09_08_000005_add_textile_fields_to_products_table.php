<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'material' => fn (Blueprint $table) => $table->string('material')->nullable(),
            'color' => fn (Blueprint $table) => $table->string('color')->nullable(),
            'pattern' => fn (Blueprint $table) => $table->string('pattern')->nullable(),
            'width_cm' => fn (Blueprint $table) => $table->unsignedInteger('width_cm')->nullable(),
            'height_cm' => fn (Blueprint $table) => $table->unsignedInteger('height_cm')->nullable(),
            'is_blackout' => fn (Blueprint $table) => $table->boolean('is_blackout')->default(false),
            'is_thermal' => fn (Blueprint $table) => $table->boolean('is_thermal')->default(false),
            'is_waterproof' => fn (Blueprint $table) => $table->boolean('is_waterproof')->default(false),
            'sample_available' => fn (Blueprint $table) => $table->boolean('sample_available')->default(false),
            'unit_type' => fn (Blueprint $table) => $table->string('unit_type')->default('pieza'),
        ];

        foreach ($columns as $column => $definition) {
            if (! Schema::hasColumn('products', $column)) {
                Schema::table('products', $definition);
            }
        }
    }

    public function down(): void
    {
        $columns = [
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
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('products', $column)) {
                Schema::table('products', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
