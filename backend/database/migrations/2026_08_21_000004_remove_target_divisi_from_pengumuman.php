<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pengumuman') && !Schema::hasColumn('pengumuman', 'target_divisi')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->string('target_divisi', 200)->nullable()->after('target_role');
            });
        }
    }

    public function down(): void
    {
        // Restoring this migration must not remove target-division data.
    }
};
