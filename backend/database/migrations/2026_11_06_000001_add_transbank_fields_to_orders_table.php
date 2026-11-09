<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('cart_token', 36)->nullable()->index();
            $table->string('transbank_token')->nullable()->unique();
            $table->string('transbank_buy_order', 26)->nullable()->unique();
            $table->string('transbank_session_id', 61)->nullable();
            $table->string('transbank_authorization_code', 20)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('payment_expires_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['transbank_token']);
            $table->dropUnique(['transbank_buy_order']);
            $table->dropIndex(['payment_expires_at']);
            $table->dropIndex(['cart_token']);
            $table->dropColumn([
                'cart_token',
                'transbank_token',
                'transbank_buy_order',
                'transbank_session_id',
                'transbank_authorization_code',
                'paid_at',
                'payment_expires_at',
            ]);
        });
    }
};
