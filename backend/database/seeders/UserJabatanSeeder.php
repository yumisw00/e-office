<?php

namespace Database\Seeders;

use App\Models\SysGroup;
use App\Models\SysUser;
use App\Models\SysUserGroup;
use App\Models\MtSdmJabatan;
use App\Models\MtSdmUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserJabatanSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            [
                'id_unit' => 'DIV-SDM',
                'nama' => 'SDM / HRD',
                'position_id' => 'PEGAWAI_SDM',
                'urutan' => 10,
                'user_name' => 'Pegawai SDM / HRD',
                'email' => 'sdm@example.test',
            ],
            [
                'id_unit' => 'DIV-KEU',
                'nama' => 'Keuangan & Akuntansi',
                'position_id' => 'PEGAWAI_KEU',
                'urutan' => 20,
                'user_name' => 'Pegawai Keuangan & Akuntansi',
                'email' => 'keuangan@example.test',
            ],
            [
                'id_unit' => 'DIV-OPS',
                'nama' => 'Operasional & Produksi',
                'position_id' => 'PEGAWAI_OPS',
                'urutan' => 30,
                'user_name' => 'Pegawai Operasional & Produksi',
                'email' => 'operasional@example.test',
            ],
            [
                'id_unit' => 'DIV-MKT',
                'nama' => 'Pemasaran & Penjualan',
                'position_id' => 'PEGAWAI_MKT',
                'urutan' => 40,
                'user_name' => 'Pegawai Pemasaran & Penjualan',
                'email' => 'pemasaran@example.test',
            ],
        ];

        $users = [];
        foreach ($divisions as $division) {
            MtSdmUnit::updateOrCreate(
                ['id_unit' => $division['id_unit']],
                [
                    'nama' => $division['nama'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $jabatan = MtSdmJabatan::updateOrCreate(
                [
                    'id_unit' => $division['id_unit'],
                    'position_id' => $division['position_id'],
                ],
                [
                    'nama' => $division['nama'],
                    'urutan' => $division['urutan'],
                    'created_date' => now(),
                    'modified_date' => now(),
                    'id_jabatan_parent' => null,
                    'superior_id' => null,
                ]
            );

            $users[] = [
                'name' => $division['user_name'],
                'email' => $division['email'],
                'jabatan_id' => $jabatan->id_jabatan,
            ];
        }

        $group = SysGroup::firstOrCreate([
            'nama' => 'Pegawai',
        ], [
            'nama' => 'Pegawai',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($users as $index => $data) {
            $user = SysUser::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('secret-password'),
                    'need_update_pass' => false,
                    'failed_login_attempts' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            SysUserGroup::updateOrCreate(
                [
                    'id_user' => $user->id_user,
                    'id_group' => $group->id_group,
                ],
                [
                    'id_jabatan' => $data['jabatan_id'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            DB::table('sys_user_group')
                ->where('id_user', $user->id_user)
                ->where('id_group', '!=', $group->id_group)
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at' => now(),
                    'updated_at' => now(),
                ]);
        }
    }
}
