<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_template')) {
            Schema::table('surat_template', function (Blueprint $table) {
                if (!Schema::hasColumn('surat_template', 'deskripsi')) {
                    $table->text('deskripsi')->nullable()->after('jenis_surat');
                }

                if (!Schema::hasColumn('surat_template', 'file_template')) {
                    $table->string('file_template')->nullable()->after('deskripsi');
                }

                if (!Schema::hasColumn('surat_template', 'is_default')) {
                    $table->boolean('is_default')->default(false)->after('file_name');
                }

                if (!Schema::hasColumn('surat_template', 'status')) {
                    $table->string('status', 50)->default('active')->after('is_active');
                }

                if (!Schema::hasColumn('surat_template', 'metadata')) {
                    $table->json('metadata')->nullable()->after('status');
                }
            });
        }

        if (!Schema::hasTable('workflow_surat')) {
            Schema::create('workflow_surat', function (Blueprint $table) {
                $table->bigIncrements('id_workflow_surat');
                $table->string('nama_workflow', 200);
                $table->string('jenis_surat', 100)->nullable();
                $table->text('deskripsi')->nullable();
                $table->json('steps')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('status', 50)->default('active');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('deleted_by')->nullable();
                $table->string('created_by_desc', 200)->nullable();
                $table->string('updated_by_desc', 200)->nullable();
                $table->string('deleted_by_desc', 200)->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['jenis_surat', 'status']);
                $table->index('is_active');
            });
        }

        if (Schema::hasTable('pengumuman') && !Schema::hasColumn('pengumuman', 'target_role')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->string('target_role', 100)->nullable()->after('konten');
            });
        }

        $this->syncFrontendMenus();
    }

    public function down(): void
    {
        if (Schema::hasTable('pengumuman') && Schema::hasColumn('pengumuman', 'target_role')) {
            Schema::table('pengumuman', function (Blueprint $table) {
                $table->dropColumn('target_role');
            });
        }

        Schema::dropIfExists('workflow_surat');

        if (Schema::hasTable('surat_template')) {
            Schema::table('surat_template', function (Blueprint $table) {
                foreach (['metadata', 'status', 'is_default', 'file_template', 'deskripsi'] as $column) {
                    if (Schema::hasColumn('surat_template', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    private function syncFrontendMenus(): void
    {
        if (!Schema::hasTable('sys_menu') || !Schema::hasTable('sys_group') || !Schema::hasTable('sys_group_menu')) {
            return;
        }

        if (Schema::hasColumn('sys_menu', 'url')) {
            DB::table('sys_menu')
                ->where('url', 'pegawai_surat_masuk')
                ->update([
                    'url' => 'surat_masuk_pegawai',
                    'nama' => 'Surat Masuk',
                    'is_show' => 1,
                    'updated_at' => now(),
                ]);
        }

        $menus = [
            'dashboard' => ['Dashboard', 10, 'home'],
            'group' => ['Hak Akses Role', 20, 'users'],
            'sys_menu' => ['Menu', 30, 'menu'],
            'sys_setting' => ['Konfigurasi', 40, 'settings'],
            'backup_database' => ['Backup Database', 50, 'database'],
            'sys_user' => ['Manajemen Pengguna', 60, 'user'],
            'sys_log' => ['Log Sistem Audit', 70, 'list'],
            'surat_masuk' => ['Surat Masuk', 100, 'mail'],
            'surat_keluar' => ['Surat Keluar', 110, 'send'],
            'surat_template' => ['Template Surat', 120, 'file'],
            'workflow_surat' => ['Workflow Surat', 130, 'git'],
            'master_organisasi' => ['Master Organisasi', 140, 'briefcase'],
            'disposisi' => ['Disposisi', 150, 'share'],
            'tracking_surat' => ['Tracking Surat', 160, 'search'],
            'surat_arsip' => ['Arsip Surat', 170, 'archive'],
            'pengumuman' => ['Pengumuman', 190, 'megaphone'],
            'surat_masuk_pegawai' => ['Surat Masuk', 105, 'mail'],
        ];

        $roles = [
            'Admin Sistem' => ['dashboard', 'group', 'sys_menu', 'sys_setting', 'backup_database', 'sys_user', 'sys_log'],
            'Admin Konten' => ['dashboard', 'surat_masuk', 'surat_keluar', 'surat_template', 'master_organisasi', 'disposisi', 'tracking_surat', 'surat_arsip', 'pengumuman'],
            'Pegawai' => ['dashboard', 'surat_masuk_pegawai', 'surat_keluar', 'disposisi', 'tracking_surat', 'surat_arsip'],
        ];

        foreach ($roles as $role => $pages) {
            $idGroup = DB::table('sys_group')
                ->where('nama', $role)
                ->whereNull('deleted_at')
                ->value('id_group');

            if (!$idGroup) {
                continue;
            }

            foreach ($pages as $page) {
                $menuConfig = $menus[$page] ?? [ucwords(str_replace('_', ' ', $page)), 999, null];
                $idMenu = $this->ensureMenu($page, $menuConfig[0], $menuConfig[1], $menuConfig[2]);
                $idGroupMenu = $this->ensureGroupMenu($idGroup, $idMenu);
                $this->ensureGroupActions($idGroupMenu, $idMenu, $role);
            }
        }
    }

    private function ensureMenu(string $url, string $label, int $sort, ?string $icon): int
    {
        $menu = DB::table('sys_menu')
            ->where('url', $url)
            ->where('nama', $label)
            ->whereNull('deleted_at')
            ->first();

        if (!$menu) {
            $menu = DB::table('sys_menu')
                ->where('url', $url)
                ->whereNull('deleted_at')
                ->orderBy('id_menu')
                ->first();
        }

        if ($menu) {
            DB::table('sys_menu')->where('id_menu', $menu->id_menu)->update([
                'nama' => $label,
                'url' => $url,
                'sort' => $sort,
                'icon' => $icon,
                'is_show' => 1,
                'updated_at' => now(),
            ]);

            return (int) $menu->id_menu;
        }

        return (int) DB::table('sys_menu')->insertGetId([
            'id_parent_menu' => null,
            'nama' => $label,
            'url' => $url,
            'sort' => $sort,
            'icon' => $icon,
            'is_show' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_menu');
    }

    private function ensureGroupMenu(int $idGroup, int $idMenu): int
    {
        $groupMenu = DB::table('sys_group_menu')
            ->where('id_group', $idGroup)
            ->where('id_menu', $idMenu)
            ->first();

        if ($groupMenu) {
            DB::table('sys_group_menu')->where('id_group_menu', $groupMenu->id_group_menu)->update([
                'deleted_at' => null,
                'updated_at' => now(),
            ]);

            return (int) $groupMenu->id_group_menu;
        }

        return (int) DB::table('sys_group_menu')->insertGetId([
            'id_group' => $idGroup,
            'id_menu' => $idMenu,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_group_menu');
    }

    private function ensureGroupActions(int $idGroupMenu, int $idMenu, string $role): void
    {
        if (!Schema::hasTable('sys_action') || !Schema::hasTable('sys_group_action')) {
            return;
        }

        $actions = ['index'];

        if (in_array($role, ['Admin Sistem', 'Admin Konten'], true)) {
            $actions = ['index', 'add', 'edit', 'delete'];
        }

        foreach ($actions as $action) {
            $idAction = $this->ensureAction($idMenu, $action);

            $exists = DB::table('sys_group_action')
                ->where('id_group_menu', $idGroupMenu)
                ->where('id_action', $idAction)
                ->whereNull('deleted_at')
                ->exists();

            if (!$exists) {
                DB::table('sys_group_action')->insert([
                    'id_group_menu' => $idGroupMenu,
                    'id_action' => $idAction,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function ensureAction(int $idMenu, string $action): int
    {
        $idAction = DB::table('sys_action')
            ->where('id_menu', $idMenu)
            ->where('nama', $action)
            ->whereNull('deleted_at')
            ->value('id_action');

        if ($idAction) {
            return (int) $idAction;
        }

        return (int) DB::table('sys_action')->insertGetId([
            'nama' => $action,
            'id_menu' => $idMenu,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_action');
    }
};
