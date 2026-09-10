<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sys_user', function (Blueprint $table) {
            $table->string('fcm_token', 512)->nullable()->index();
            $table->string('device_name', 150)->nullable();
            $table->timestamp('device_last_active')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sys_user', function (Blueprint $table) {
            $table->dropColumn(['fcm_token', 'device_name', 'device_last_active']);
        });
    }
};
