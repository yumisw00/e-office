<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('digital_signature') && !Schema::hasColumn('digital_signature', 'signature_path')) {
            Schema::table('digital_signature', function (Blueprint $table) {
                $table->string('signature_path')->nullable()->after('qr_code_path');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('digital_signature') && Schema::hasColumn('digital_signature', 'signature_path')) {
            Schema::table('digital_signature', function (Blueprint $table) {
                $table->dropColumn('signature_path');
            });
        }
    }
};
