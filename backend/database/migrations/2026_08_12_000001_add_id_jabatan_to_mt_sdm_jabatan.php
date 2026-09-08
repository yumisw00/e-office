<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add id_jabatan column to mt_sdm_jabatan to match sys_user_group.id_jabatan.
     * This column is needed for the join in notificationRecipients() and other
     * user-unit queries (sys_user -> sys_user_group -> mt_sdm_jabatan -> mt_sdm_unit).
     */
    public function up(): void
    {
        // Use raw SQL to avoid Laravel schema builder type inference issues.
        // Add as varchar(50) to match sys_user_group.id_jabatan (stores position_id values like 'PEGAWAI', 'DIREKTUR')
        DB::statement('ALTER TABLE mt_sdm_jabatan ADD COLUMN IF NOT EXISTS id_jabatan VARCHAR(50)');

        // Populate id_jabatan with position_id values so existing sys_user_group.id_jabatan references work
        DB::statement('UPDATE mt_sdm_jabatan SET id_jabatan = position_id WHERE id_jabatan IS NULL AND position_id IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE mt_sdm_jabatan DROP COLUMN IF EXISTS id_jabatan');
    }
};
