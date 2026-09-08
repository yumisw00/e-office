<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!DB::getSchemaBuilder()->hasTable('mt_sdm_unit')) {
            return;
        }

        DB::table('mt_sdm_unit')
            ->whereNull('deleted_at')
            ->whereIn('id_unit', ['DIV-SDM', 'DIV-KEU', 'DIV-OPS', 'DIV-MKT'])
            ->update([
                'id_parent' => 'DIR-UTAMA',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('mt_sdm_unit')
            ->whereIn('id_unit', ['DIV-SDM', 'DIV-KEU', 'DIV-OPS', 'DIV-MKT'])
            ->where('id_parent', 'DIR-UTAMA')
            ->update([
                'id_parent' => null,
                'updated_at' => now(),
            ]);
    }
};
