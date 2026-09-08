<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mt_sdm_unit') || !Schema::hasTable('mt_sdm_jabatan')) {
            return;
        }

        $divisions = [
            [
                'id_unit' => 'DIV-SDM',
                'nama' => 'SDM / HRD',
                'position_id' => 'PEGAWAI_SDM',
                'legacy_position_id' => 'DIREKTUR',
                'urutan' => 10,
            ],
            [
                'id_unit' => 'DIV-KEU',
                'nama' => 'Keuangan & Akuntansi',
                'position_id' => 'PEGAWAI_KEU',
                'legacy_position_id' => 'MANKEU',
                'urutan' => 20,
            ],
            [
                'id_unit' => 'DIV-OPS',
                'nama' => 'Operasional & Produksi',
                'position_id' => 'PEGAWAI_OPS',
                'legacy_position_id' => 'PIMPINAN',
                'urutan' => 30,
            ],
            [
                'id_unit' => 'DIV-MKT',
                'nama' => 'Pemasaran & Penjualan',
                'position_id' => 'PEGAWAI_MKT',
                'legacy_position_id' => 'PEGAWAI',
                'urutan' => 40,
            ],
        ];

        foreach ($divisions as $division) {
            DB::table('mt_sdm_unit')->updateOrInsert(
                ['id_unit' => $division['id_unit']],
                $this->timestamped([
                    'nama' => $division['nama'],
                ], 'mt_sdm_unit')
            );

            $payload = $this->timestamped([
                'nama' => $division['nama'],
                'id_unit' => $division['id_unit'],
                'urutan' => $division['urutan'],
                'created_date' => now(),
                'modified_date' => now(),
                'id_jabatan_parent' => null,
                'superior_id' => null,
            ], 'mt_sdm_jabatan');

            $updated = DB::table('mt_sdm_jabatan')
                ->where('position_id', $division['legacy_position_id'])
                ->update($payload);

            if (!$updated) {
                DB::table('mt_sdm_jabatan')->updateOrInsert(
                    [
                        'position_id' => $division['position_id'],
                        'id_unit' => $division['id_unit'],
                    ],
                    $payload
                );
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('mt_sdm_unit') || !Schema::hasTable('mt_sdm_jabatan')) {
            return;
        }

        $legacyJabatans = [
            'DIREKTUR' => ['nama' => 'Direktur', 'id_unit' => 'UNIT01', 'urutan' => 1],
            'MANKEU' => ['nama' => 'Manajer Keuangan', 'id_unit' => 'UNIT01', 'urutan' => 2],
            'PIMPINAN' => ['nama' => 'Pimpinan', 'id_unit' => 'UNIT01', 'urutan' => 3],
            'PEGAWAI' => ['nama' => 'Pegawai', 'id_unit' => 'UNIT01', 'urutan' => 4],
        ];

        foreach ($legacyJabatans as $positionId => $jabatan) {
            DB::table('mt_sdm_jabatan')
                ->where('position_id', $positionId)
                ->update($this->timestamped([
                    'nama' => $jabatan['nama'],
                    'id_unit' => $jabatan['id_unit'],
                    'urutan' => $jabatan['urutan'],
                    'modified_date' => now(),
                ], 'mt_sdm_jabatan'));
        }

        $unitIds = ['DIV-SDM', 'DIV-KEU', 'DIV-OPS', 'DIV-MKT'];
        $positionIds = ['PEGAWAI_SDM', 'PEGAWAI_KEU', 'PEGAWAI_OPS', 'PEGAWAI_MKT'];

        DB::table('mt_sdm_jabatan')->whereIn('position_id', $positionIds)->delete();

        DB::table('mt_sdm_unit')
            ->whereIn('id_unit', $unitIds)
            ->delete();
    }

    private function timestamped(array $data, string $table): array
    {
        if (Schema::hasColumn($table, 'created_at')) {
            $data['created_at'] = now();
        }

        if (Schema::hasColumn($table, 'updated_at')) {
            $data['updated_at'] = now();
        }

        return $data;
    }
};
