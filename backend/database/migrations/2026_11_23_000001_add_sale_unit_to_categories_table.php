<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('sale_unit', 20)->default('unit');
        });

        DB::table('categories')
            ->where(function ($query) {
                $query->where('slug', 'like', '%tela%')
                    ->orWhere('slug', 'like', '%tapiceria%')
                    ->orWhere('slug', 'like', '%rollo%')
                    ->orWhere('slug', 'like', '%textil%');
            })
            ->update(['sale_unit' => 'meter']);
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('sale_unit');
        });
    }
};
