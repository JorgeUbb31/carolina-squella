<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('receipt_email_sent_at')->nullable();
            $table->timestamp('receipt_email_claimed_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['receipt_email_claimed_at']);
            $table->dropColumn(['receipt_email_sent_at', 'receipt_email_claimed_at']);
        });
    }
};
