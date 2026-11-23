<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_controls', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->string('status')->default('in_progress');
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_control_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_control_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('product_slug');
            $table->string('category_name')->nullable();
            $table->string('unit_type')->default('unidad');
            $table->unsignedInteger('system_stock_snapshot');
            $table->unsignedBigInteger('movement_id_snapshot')->default(0);
            $table->unsignedBigInteger('counted_movement_id')->nullable();
            $table->unsignedInteger('expected_stock')->nullable();
            $table->unsignedInteger('counted_stock')->nullable();
            $table->integer('difference')->nullable();
            $table->timestamp('counted_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['inventory_control_id', 'product_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('inventory_control_id')
                ->nullable()
                ->after('user_id')
                ->constrained('inventory_controls')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_control_id');
        });

        Schema::dropIfExists('inventory_control_items');
        Schema::dropIfExists('inventory_controls');
    }
};
