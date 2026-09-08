<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sys_user')) {
            if (!Schema::hasColumn('sys_user', 'is_penanda_tangan')) {
                Schema::table('sys_user', function (Blueprint $table) {
                    $table->boolean('is_penanda_tangan')->default(false)->after('email');
                });
            }
            if (!Schema::hasColumn('sys_user', 'is_signer')) {
                Schema::table('sys_user', function (Blueprint $table) {
                    $table->boolean('is_signer')->default(false)->after('is_penanda_tangan');
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sys_user')) {
            Schema::table('sys_user', function (Blueprint $table) {
                if (Schema::hasColumn('sys_user', 'is_penanda_tangan')) {
                    $table->dropColumn('is_penanda_tangan');
                }
                if (Schema::hasColumn('sys_user', 'is_signer')) {
                    $table->dropColumn('is_signer');
                }
            });
        }
    }
};
