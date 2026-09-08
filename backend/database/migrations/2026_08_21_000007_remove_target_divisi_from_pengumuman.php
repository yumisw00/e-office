<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('pengumuman_divisi');

        if (Schema::hasTable('pengumuman') && Schema::hasColumn('pengumuman', 'target_divisi')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->dropColumn('target_divisi');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pengumuman') && !Schema::hasColumn('pengumuman', 'target_divisi')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->string('target_divisi', 200)->nullable()->after('target_role');
            });
        }
    }
};
