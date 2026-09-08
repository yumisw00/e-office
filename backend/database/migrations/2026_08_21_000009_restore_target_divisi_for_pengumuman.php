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

        if (!Schema::hasTable('pengumuman_divisi')) {
            Schema::create('pengumuman_divisi', function (Blueprint $table) {
                $table->bigIncrements('id_pengumuman_divisi');
                $table->unsignedBigInteger('id_pengumuman');
                $table->string('id_divisi', 100);
                $table->timestamps();
                $table->unique(['id_pengumuman', 'id_divisi'], 'pengumuman_divisi_unique');
                $table->index('id_divisi');
            });
        }
    }

    public function down(): void
    {
        // Preserve target-division configuration on rollback.
    }
};
