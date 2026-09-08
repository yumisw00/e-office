<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pengumuman')) {
            return;
        }

        Schema::table('pengumuman', function (Blueprint $table) {
            if (!Schema::hasColumn('pengumuman', 'kategori')) {
                $table->string('kategori', 50)->default('informasi')->after('judul');
            }

            if (!Schema::hasColumn('pengumuman', 'target_divisi')) {
                $table->string('target_divisi', 200)->nullable()->after('target_role');
            }

            if (!Schema::hasColumn('pengumuman', 'lampiran')) {
                $table->string('lampiran', 2048)->nullable()->after('published_at');
            }

            $table->index(['kategori', 'status'], 'pengumuman_kategori_status_index');
            $table->index(['target_role', 'published_at'], 'pengumuman_target_role_published_index');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('pengumuman')) {
            return;
        }

        Schema::table('pengumuman', function (Blueprint $table) {
            $table->dropIndex('pengumuman_kategori_status_index');
            $table->dropIndex('pengumuman_target_role_published_index');

            foreach (['kategori', 'target_divisi', 'lampiran'] as $column) {
                if (Schema::hasColumn('pengumuman', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
