<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sys_notification') && !Schema::hasColumn('sys_notification', 'deleted_at')) {
            Schema::table('sys_notification', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('audit_trail_immutable') && !Schema::hasColumn('audit_trail_immutable', 'deleted_at')) {
            Schema::table('audit_trail_immutable', function (Blueprint $table) {
                $table->timestamp('updated_at')->nullable();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('audit_trail_immutable') && Schema::hasColumn('audit_trail_immutable', 'deleted_at')) {
            Schema::table('audit_trail_immutable', function (Blueprint $table) {
                $table->dropColumn(['updated_at', 'deleted_at']);
            });
        }

        if (Schema::hasTable('sys_notification') && Schema::hasColumn('sys_notification', 'deleted_at')) {
            Schema::table('sys_notification', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
