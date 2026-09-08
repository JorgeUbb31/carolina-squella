<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('material')->nullable()->after('stock');
            $table->string('color')->nullable()->after('material');
            $table->string('pattern')->nullable()->after('color');
            $table->unsignedInteger('width_cm')->nullable()->after('pattern');
            $table->unsignedInteger('height_cm')->nullable()->after('width_cm');
            $table->boolean('is_blackout')->default(false)->after('height_cm');
            $table->boolean('is_thermal')->default(false)->after('is_blackout');
            $table->boolean('is_waterproof')->default(false)->after('is_thermal');
            $table->boolean('sample_available')->default(false)->after('is_waterproof');
            $table->string('unit_type')->default('pieza')->after('sample_available');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
