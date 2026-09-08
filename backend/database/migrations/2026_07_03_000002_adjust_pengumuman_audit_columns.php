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
            if (!Schema::hasColumn('pengumuman', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('updated_by');
            }

            if (!Schema::hasColumn('pengumuman', 'created_by_desc')) {
                $table->string('created_by_desc', 200)->nullable()->after('deleted_by');
            }

            if (!Schema::hasColumn('pengumuman', 'updated_by_desc')) {
                $table->string('updated_by_desc', 200)->nullable()->after('created_by_desc');
            }

            if (!Schema::hasColumn('pengumuman', 'deleted_by_desc')) {
                $table->string('deleted_by_desc', 200)->nullable()->after('updated_by_desc');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('pengumuman')) {
            return;
        }

        Schema::table('pengumuman', function (Blueprint $table) {
            foreach (['deleted_by_desc', 'updated_by_desc', 'created_by_desc', 'deleted_by'] as $column) {
                if (Schema::hasColumn('pengumuman', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
