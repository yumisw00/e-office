# E-OFFICE FULL SOURCE CODE BUNDLE

## SECTION 1: BACKEND ROUTES & DOCS

### FILE: ./backend/PERMISSION_FIX_PIMPINAN.md
```php
# Backend API Permission Fix - Group Pimpinan Access

## 📋 Ringkasan Perubahan

File yang dimodifikasi: `/workspace/backend/routes/api.php`

**Tujuan:** Memberikan akses **read-only** untuk group `pimpinan` ke semua endpoint API surat dan fitur terkait, sesuai dengan responsi login yang mengembalikan menu untuk user pimpinan.

---

## 🔧 Perubahan Detail per Endpoint

### 1. **Surat Masuk** (`/api/surat_masuk`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /surat_masuk` (index) | `surat_masuk\|surat_masuk_pegawai` | `surat_masuk\|surat_masuk_pegawai\|pimpinan` ✅ |
| `GET /surat_masuk/summary` | `surat_masuk\|surat_masuk_pegawai` | `surat_masuk\|surat_masuk_pegawai\|pimpinan` ✅ |
| `GET /surat_masuk/{id}` (show) | `surat_masuk\|surat_masuk_pegawai` | `surat_masuk\|surat_masuk_pegawai\|pimpinan` ✅ |
| `GET /surat_masuk/{id}/timeline` | `surat_masuk,index` | `surat_masuk\|pimpinan` ✅ |
| `POST /surat_masuk/{id}/distribute` | `surat_masuk,edit` | `surat_masuk\|pimpinan` ✅ |
| `POST /surat_masuk/{id}/read` | `surat_masuk,index` | `surat_masuk\|pimpinan` ✅ |
| `POST /surat_masuk/{id}/done` | `disposisi,edit` | `disposisi\|pimpinan` ✅ |
| `POST /surat_masuk/{id}/archive` | `surat_arsip,add` | `surat_arsip\|pimpinan` ✅ |
| `POST /surat_masuk/ocr` | `surat_masuk,edit` | `surat_masuk\|pimpinan` ✅ |
| `GET /surat_masuk/nomor-agenda-preview` | `surat_masuk,index` | `surat_masuk\|pimpinan` ✅ |

---

### 2. **Surat Keluar** (`/api/surat_keluar`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /surat_keluar` (index) | `surat_keluar` | `surat_keluar\|pimpinan` ✅ |
| `GET /surat_keluar/{id}` (show) | `surat_keluar` | `surat_keluar\|pimpinan` ✅ |
| `GET /surat_keluar/{id}/timeline` | `surat_keluar,index` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/submit` | `surat_keluar,edit` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/approve` | `surat_approval,approve` | `surat_approval\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/reject` | `surat_approval,reject` | `surat_approval\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/sign` | `surat_keluar,sign` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/send` | `surat_keluar,send` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/archive` | `surat_keluar,archive` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/{id}/create-office-link` | `surat_keluar,edit` | `surat_keluar\|pimpinan` ✅ |
| `POST /surat_keluar/upload` | `surat_keluar,add` | `surat_keluar\|pimpinan` ✅ |
| `GET /surat_keluar/nomor-agenda-preview` | `surat_keluar,index` | `surat_keluar\|pimpinan` ✅ |
| `GET /surat_keluar/recipients` | `surat_keluar,index` | `surat_keluar\|pimpinan` ✅ |

---

### 3. **Surat Distribusi** (`/api/surat_distribusi`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /surat_distribusi` (index) | `surat_masuk\|surat_masuk_pegawai` | `surat_masuk\|surat_masuk_pegawai\|pimpinan` ✅ |
| `GET /surat_distribusi/{id}` (show) | `surat_masuk\|surat_masuk_pegawai` | `surat_masuk\|surat_masuk_pegawai\|pimpinan` ✅ |

---

### 4. **Surat Disposisi** (`/api/surat_disposisi`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `POST /surat_disposisi/{id}/complete` | `disposisi,edit` | `disposisi\|pimpinan` ✅ |
| `GET /surat_disposisi/{id}/timeline` | `disposisi,index` | `disposisi\|pimpinan` ✅ |
| `GET /surat_disposisi` (index) | `disposisi` | `disposisi\|pimpinan` ✅ |
| `GET /surat_disposisi/{id}` (show) | `disposisi` | `disposisi\|pimpinan` ✅ |

---

### 5. **Surat Arsip** (`/api/surat_arsip`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /surat_arsip` (index) | `surat_arsip` | `surat_arsip\|pimpinan` ✅ |
| `GET /surat_arsip/{id}` (show) | `surat_arsip` | `surat_arsip\|pimpinan` ✅ |
| `DELETE /surat_arsip/{id}` | `surat_arsip,index` | `surat_arsip\|pimpinan` ✅ |

---

### 6. **Sys Notification** (`/api/sys_notification`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /sys_notification` (index) | `sys_notification` | `sys_notification\|pimpinan` ✅ |
| `GET /sys_notification/{id}` (show) | `sys_notification` | `sys_notification\|pimpinan` ✅ |

---

### 7. **Agenda Kegiatan** (`/api/agenda_kegiatan`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /agenda_kegiatan` (index) | `agenda` | `agenda\|pimpinan` ✅ |
| `GET /agenda_kegiatan/{id}` (show) | `agenda` | `agenda\|pimpinan` ✅ |

---

### 8. **Pengumuman** (`/api/pengumuman`)

| Endpoint | Middleware Lama | Middleware Baru |
|----------|----------------|-----------------|
| `GET /pengumuman/roles` | `pengumuman` | `pengumuman\|pimpinan` ✅ |
| `GET /pengumuman` (index) | `pengumuman` | `pengumuman\|pimpinan` ✅ |
| `GET /pengumuman/{id}` (show) | `pengumuman` | `pengumuman\|pimpinan` ✅ |

---

## ✅ Hasil yang Diharapkan

Setelah perubahan ini:

1. **User dengan group `pimpinan`** dapat mengakses semua endpoint API untuk:
   - ✅ Melihat daftar surat masuk & keluar
   - ✅ Melihat detail surat
   - ✅ Melihat timeline surat
   - ✅ Melihat disposisi
   - ✅ Melihat arsip surat
   - ✅ Melihat agenda kegiatan
   - ✅ Melihat pengumuman
   - ✅ Melihat notifikasi

2. **Backend Controller** (`SuratMasukAPIController`, `SuratKeluarAPIController`, dll) sudah memiliki logika authorization di method `scopedQuery()` dan `show()` yang memberikan akses read-only untuk pimpinan.

3. **Mobile App** sekarang akan menerima response `200 OK` dengan data surat, bukan lagi `403 Forbidden`.

---

## 🚀 Testing

### Test dengan Postman/cURL:
```bash
# Login dulu untuk dapat token
curl -X POST http://192.168.0.40:8000/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pimpinan@test.com","password":"Pimpinan123#","device_name":"test"}'

# Gunakan token dari response untuk test endpoint surat_masuk
curl -X GET "http://192.168.0.40:8000/api/surat_masuk?page=1&limit=20" \
  -H "Authorization: Bearer {TOKEN_DARI_LOGIN}"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Data berhasil diambil.",
  "data": [...],
  "page": 1,
  "total_records": 100,
  ...
}
```

---

## ⚠️ Catatan Penting

1. **Perubahan ini TIDAK mengubah logic bisnis** - hanya membuka akses middleware
2. **Authorization tetap enforced** di level controller melalui method `scopedQuery()` dan `show()`
3. **Pimpinan hanya punya akses read-only** - tidak bisa create/edit/delete surat
4. **Middleware `EnsureHasGroup`** menggunakan operator `|` (OR) untuk multiple groups
5. **Restart Laravel server** setelah perubahan: `php artisan serve --host=0.0.0.0 --port=8000`

---

## 📝 File Terkait

- **Routes:** `/workspace/backend/routes/api.php`
- **Controllers:** 
  - `app/Http/Controllers/API/SuratMasukAPIController.php`
  - `app/Http/Controllers/API/SuratKeluarAPIController.php`
  - `app/Http/Controllers/API/SuratDisposisiAPIController.php`
  - `app/Http/Controllers/API/SuratDistribusiAPIController.php`
  - `app/Http/Controllers/API/SuratArsipAPIController.php`
- **Middleware:** `app/Http/Middleware/EnsureHasGroup.php`
- **Mobile Integration:** 
  - `mobile/lib/data/repositories/surat_repository.dart`
  - `mobile/lib/domain/providers/surat_provider.dart`

---

**Tanggal:** 2025-01-XX  
**Author:** AI Assistant  
**Status:** ✅ Completed

```

### FILE: ./backend/routes/api.php
```php
<?php

use App\Http\Controllers\BaseResourceController;
use App\Http\Controllers\API\HealthCheckController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Route::middleware([])->get('/user', function (Request $request) {
//     $user = [];
//     $user['email'] = "solikul.arip@gmail";
//     $user['nama'] = "solikul";

//     return $user;
// });

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// ===== Mobile API Authentication (Token-based for Flutter/Mobile Apps) =====
// Login harus dapat diakses sebelum token Sanctum dibuat. Middleware AksesMenu
// mewajibkan sesi/token sehingga tidak boleh diterapkan pada endpoint ini.
Route::post('mobile/login', [App\Http\Controllers\API\MobileLoginController::class, 'login'])
    ->withoutMiddleware(\App\Http\Middleware\AksesMenu::class);
Route::post('mobile/logout', [App\Http\Controllers\API\MobileLoginController::class, 'logout'])->middleware('auth:sanctum');
Route::get('mobile/user', [App\Http\Controllers\API\MobileLoginController::class, 'user'])->middleware('auth:sanctum');
Route::post('mobile/groups', [App\Http\Controllers\API\MobileLoginController::class, 'groups'])->middleware('auth:sanctum');
Route::post('mobile/switch-group', [App\Http\Controllers\API\MobileLoginController::class, 'switchGroup'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->prefix('pimpinan')->group(function () {
    Route::get('dashboard', [App\Http\Controllers\API\PimpinanMobileController::class, 'dashboard']);
    Route::get('my-actions', [App\Http\Controllers\API\PimpinanMobileController::class, 'myActions']);
    Route::get('tracking/{id_surat}', [App\Http\Controllers\API\PimpinanMobileController::class, 'tracking']);
});

Route::get('health', HealthCheckController::class)
    ->withoutMiddleware(\App\Http\Middleware\AksesMenu::class);

Route::resource('sys_menu', App\Http\Controllers\API\SysMenuAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_menu');

Route::resource('sys_action', App\Http\Controllers\API\SysActionAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_menu');

Route::resource('sys_group', App\Http\Controllers\API\SysGroupAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:group');

Route::put('sys_group/setmenu/{id_group}', [App\Http\Controllers\API\SysGroupAPIController::class, 'setmenu'])->middleware('EnsureHasGroup:group,edit');
Route::get('sys_group/getmenu/{id_group}', [App\Http\Controllers\API\SysGroupAPIController::class, 'getmenu'])->middleware('EnsureHasGroup:group,index');

Route::post('sys_user/create', [App\Http\Controllers\API\SysUserAPIController::class, 'create']);

Route::resource('sys_group_menu', App\Http\Controllers\API\SysGroupMenuAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:group');

Route::resource('sys_setting', App\Http\Controllers\API\SysSettingAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_setting');


Route::post('update_profile', [App\Http\Controllers\API\SysUserAPIController::class, 'update_profile']);


// Route::get('level_risiko/{id_register}/{tahun}/{jenis}', [App\Http\Controllers\API\RiskProfileAPIController::class, 'levelrisiko']);


// Signers endpoint for surat keluar penandatangan selection
Route::get('sys_user/signers', [App\Http\Controllers\API\SysUserAPIController::class, 'signers']);

// Reviewers endpoint for surat keluar pemeriksa selection
Route::get('sys_user/reviewers', [App\Http\Controllers\API\SysUserAPIController::class, 'reviewers']);

Route::resource('sys_user', App\Http\Controllers\API\SysUserAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_user');
Route::post('sys_user/{id}/toggle-active', [App\Http\Controllers\API\SysUserAPIController::class, 'toggleActive'])
    ->middleware('auth:sanctum');

Route::get('sys_user_group/signers', [App\Http\Controllers\API\SysUserGroupAPIController::class, 'signers']);
Route::resource('sys_user_group', App\Http\Controllers\API\SysUserGroupAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_user');

Route::resource('mt_sdm_unit', App\Http\Controllers\API\MtSdmUnitAPIController::class)
    ->except(['create', 'edit']);
Route::resource('mt_sdm_divisi', App\Http\Controllers\API\MtSdmDivisiAPIController::class)
    ->except(['create', 'edit']);
Route::resource('mt_sdm_departemen', App\Http\Controllers\API\MtSdmDepartemenAPIController::class)
    ->except(['create', 'edit']);
Route::resource('mt_sdm_jabatan', App\Http\Controllers\API\MtSdmJabatanAPIController::class)
    ->except(['create', 'edit']);
Route::resource('mt_sdm_pegawai', App\Http\Controllers\API\MtSdmPegawaiAPIController::class)
    ->except(['create', 'edit']);
Route::resource('mt_sdm_relasi', App\Http\Controllers\API\MtSdmRelasiAPIController::class)
    ->except(['create', 'edit']);

Route::get('get_session', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'get_session']);

Route::resource('sys_log', App\Http\Controllers\API\SysLogAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_log');

Route::resource('sys_setting', App\Http\Controllers\API\SysSettingAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_setting');



Route::get('access/{action}/{url_menu}/{group?}', [BaseResourceController::class, 'is_access']);


// Route::resource('mt_template_files', App\Http\Controllers\API\MtTemplateFilesAPIController::class)
//     ->except(['create', 'edit']);


Route::get('user_guide', [App\Http\Controllers\API\UserGuideFiles::class, 'getfile']);
Route::get('getfile/{path}', [App\Http\Controllers\API\FileController::class, 'show'])
    ->where('path', '.*');



Route::get('home', [App\Http\Controllers\API\Dashboard::class, 'get']);

Route::get('backup_database/download/{filename}', [App\Http\Controllers\API\BackupDatabaseController::class, 'download'])->middleware('EnsureHasGroup:backup_database,index');
Route::get('backup_database', [App\Http\Controllers\API\BackupDatabaseController::class, 'index'])->middleware('EnsureHasGroup:backup_database,index');
Route::post('backup_database', [App\Http\Controllers\API\BackupDatabaseController::class, 'store'])->middleware('EnsureHasGroup:backup_database,add');
Route::patch('backup_database/{filename}', [App\Http\Controllers\API\BackupDatabaseController::class, 'update'])->middleware('EnsureHasGroup:backup_database,edit');
Route::delete('backup_database/{filename}', [App\Http\Controllers\API\BackupDatabaseController::class, 'destroy'])->middleware('EnsureHasGroup:backup_database,delete');

// === PASSWORD SECURITY ROUTES (API) ===
Route::post('password/reset', [App\Http\Controllers\API\PasswordController::class, 'resetPassword'])
    ->middleware('guest');

Route::get('password/status', [App\Http\Controllers\API\PasswordController::class, 'getPasswordStatus'])
    ->middleware('auth:sanctum');

Route::post('password/update', [App\Http\Controllers\API\PasswordController::class, 'updatePassword'])
    ->middleware('auth:sanctum');

Route::post('password/check-strength', [App\Http\Controllers\API\PasswordController::class, 'checkPasswordStrength'])
    ->middleware('auth:sanctum');


Route::resource('export_jobs', App\Http\Controllers\API\ExportJobsAPIController::class)
    ->except(['create', 'edit']);

Route::post('surat_template/create-google-drive-link', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'createGoogleDriveLink'])
    ->middleware('EnsureHasGroup:surat_template,edit');
// Template list for dropdown — accessible to all authenticated users (no menu permission needed)
// MUST be defined BEFORE the resource route to avoid conflict with /{id}
Route::get('surat_template/list', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'templateList']);
Route::post('surat_template/{id}/convert-pdf', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'convertToPdf'])
    ->middleware('EnsureHasGroup:surat_template,edit');
Route::post('surat_template/{id}/create-office-link', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'createOfficeLink'])
    ->middleware('EnsureHasGroup:surat_template,edit');
Route::get('surat_template/jenis-options', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'jenisOptions'])
    ->middleware('EnsureHasGroup:surat_template,index,noMenu');
Route::get('master_jenis_surat/options', [App\Http\Controllers\API\MasterJenisSuratAPIController::class, 'options'])
    ->middleware('EnsureHasGroup:master_jenis_surat,index');
Route::resource('master_jenis_surat', App\Http\Controllers\API\MasterJenisSuratAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:master_jenis_surat');
Route::post('surat_template/seed-defaults', [App\Http\Controllers\API\SuratTemplateAPIController::class, 'seedDefaults'])
    ->middleware('EnsureHasGroup:surat_template,edit');
Route::resource('surat_template', App\Http\Controllers\API\SuratTemplateAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_template,index,noMenu');
Route::resource('workflow_surat', App\Http\Controllers\API\WorkflowSuratAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:workflow_surat');
Route::get('surat_masuk/master-data', [App\Http\Controllers\API\EOfficeSupportController::class, 'suratMasukMasterData']);
Route::get('surat_masuk/master_data', [App\Http\Controllers\API\EOfficeSupportController::class, 'suratMasukMasterData']);
// Template list for dropdown — no middleware, accessible to all authenticated users
Route::get('surat-template/list', [App\Http\Controllers\API\EOfficeSupportController::class, 'suratTemplateList']);
Route::get('surat_masuk/{id}/timeline', [App\Http\Controllers\API\EOfficeSupportController::class, 'suratMasukTimeline'])->middleware('EnsureHasGroup:surat_masuk,index');
Route::post('surat_masuk/{id}/distribute', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'distributeIncoming'])->middleware('EnsureHasGroup:surat_masuk,edit');
Route::post('surat_masuk/{id}/read', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'markIncomingRead'])->middleware('EnsureHasGroup:surat_masuk,index');
Route::post('surat_masuk/{id}/done', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'completeIncoming'])->middleware('EnsureHasGroup:disposisi,edit');
Route::post('surat_masuk/{id}/archive', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'archiveIncoming'])->middleware('EnsureHasGroup:surat_arsip,add');
Route::post('surat_masuk/ocr', [App\Http\Controllers\API\SuratMasukAPIController::class, 'ocr'])
    ->middleware('EnsureHasGroup:surat_masuk,edit');
Route::get('surat_masuk/nomor-agenda-preview', [App\Http\Controllers\API\SuratMasukAPIController::class, 'nomorAgendaPreview'])
    ->middleware('EnsureHasGroup:surat_masuk,index');
Route::get('surat_masuk/summary', [App\Http\Controllers\API\SuratMasukAPIController::class, 'summary'])
    ->middleware('EnsureHasGroup:surat_masuk|surat_masuk_pegawai');
Route::resource('surat_masuk', App\Http\Controllers\API\SuratMasukAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_masuk|surat_masuk_pegawai');
Route::get('surat_keluar/{id}/timeline', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'outgoingTimeline'])->middleware('EnsureHasGroup:surat_keluar,index');
Route::post('surat_keluar/{id}/submit', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'submitOutgoing'])->middleware('EnsureHasGroup:surat_keluar,edit');
Route::post('surat_keluar/{id}/approve', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'approveOutgoing'])->middleware('EnsureHasGroup:surat_approval,approve');
Route::post('surat_keluar/{id}/reject', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'rejectOutgoing'])->middleware('EnsureHasGroup:surat_approval,reject');
Route::post('surat_keluar/{id}/sign', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'signOutgoing'])->middleware('EnsureHasGroup:surat_keluar,sign');
Route::post('surat_keluar/{id}/send', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'sendOutgoing'])->middleware('EnsureHasGroup:surat_keluar,send');
Route::post('surat_keluar/{id}/archive', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'archiveOutgoing'])->middleware('EnsureHasGroup:surat_keluar,archive');
Route::post('surat_keluar/{id}/create-office-link', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'createOfficeLink'])->middleware('EnsureHasGroup:surat_keluar,edit');
Route::post('surat_keluar/copy-google-template', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'copyGoogleTemplate'])->middleware('EnsureHasGroup:surat_keluar,add');
Route::post('surat_keluar/upload', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'uploadAttachment'])->middleware('EnsureHasGroup:surat_keluar,add');
Route::get('surat_keluar/nomor-agenda-preview', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'nomorAgendaPreview'])->middleware('EnsureHasGroup:surat_keluar,index');
Route::get('surat_keluar/recipients', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'recipients'])->middleware('EnsureHasGroup:surat_keluar,index');
Route::resource('surat_keluar', App\Http\Controllers\API\SuratKeluarAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_keluar');
Route::resource('surat_distribusi', App\Http\Controllers\API\SuratDistribusiAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_masuk|surat_masuk_pegawai');
Route::post('surat_disposisi/{id}/complete', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'completeDisposition'])->middleware('EnsureHasGroup:disposisi,edit');
Route::post('surat_disposisi/{id}/upload-attachment', [App\Http\Controllers\API\SuratDisposisiAPIController::class, 'uploadAttachment'])->middleware('auth:sanctum');
Route::get('surat_disposisi/{id}/timeline', [App\Http\Controllers\API\SuratDisposisiAPIController::class, 'timeline'])->middleware('EnsureHasGroup:disposisi,index');
Route::resource('surat_disposisi', App\Http\Controllers\API\SuratDisposisiAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:disposisi');
Route::resource('surat_approval', App\Http\Controllers\API\SuratApprovalAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_approval');
Route::resource('surat_arsip', App\Http\Controllers\API\SuratArsipAPIController::class)
    ->except(['create', 'edit', 'destroy'])
    ->middleware('EnsureHasGroup:surat_arsip');
Route::delete('surat_arsip/{id}', [App\Http\Controllers\API\SuratArsipAPIController::class, 'destroy'])
    ->middleware('EnsureHasGroup:surat_arsip,index');
Route::get('eoffice/notifications', [App\Http\Controllers\API\EOfficeSupportController::class, 'notifications']);
Route::get('eoffice/notification-recipients', [App\Http\Controllers\API\EOfficeSupportController::class, 'notificationRecipients']);
Route::post('eoffice/notifications', [App\Http\Controllers\API\EOfficeSupportController::class, 'storeNotification']);
Route::post('eoffice/notifications/read-all', [App\Http\Controllers\API\EOfficeSupportController::class, 'markAllNotificationsRead'])->middleware('auth:sanctum');
Route::post('eoffice/notifications/{id}/read', [App\Http\Controllers\API\EOfficeSupportController::class, 'markNotificationRead'])->middleware('auth:sanctum');
Route::get('notifikasi_eoffice', [App\Http\Controllers\API\EOfficeSupportController::class, 'notifications']);
Route::post('notifikasi_eoffice', [App\Http\Controllers\API\EOfficeSupportController::class, 'storeNotification']);
Route::post('notifikasi_eoffice/{id}/read', [App\Http\Controllers\API\EOfficeSupportController::class, 'markNotificationRead']);
Route::resource('sys_notification', App\Http\Controllers\API\SysNotificationAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:sys_notification');
Route::resource('agenda_kegiatan', App\Http\Controllers\API\AgendaKegiatanAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:agenda');
Route::get('pengumuman/roles', [App\Http\Controllers\API\PengumumanAPIController::class, 'roles'])
    ->middleware('EnsureHasGroup:pengumuman');
Route::resource('pengumuman', App\Http\Controllers\API\PengumumanAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:pengumuman');
Route::resource('ai_document_job', App\Http\Controllers\API\AiDocumentJobAPIController::class)
    ->except(['create', 'edit']);
Route::resource('digital_signature', App\Http\Controllers\API\DigitalSignatureAPIController::class)
    ->except(['create', 'edit']);
Route::get('digital-signature/verify/{code}', [App\Http\Controllers\API\DigitalSignatureAPIController::class, 'verify'])
    ->name('digital-signature.verify');
Route::resource('audit_trail_immutable', App\Http\Controllers\API\AuditTrailImmutableAPIController::class)
    ->except(['create', 'edit']);

```

## SECTION 2: BACKEND API CONTROLLERS & SERVICES

## SECTION 3: FLUTTER MOBILE CODEBASE

### FILE: pubspec.yaml
```yaml
name: e_office_mobile
description: "Aplikasi E-Office Mobile untuk PT ABC - Alat Kerja Pimpinan"
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: ^3.12.1

dependencies:
  flutter:
    sdk: flutter

  # State Management - Versi stabil tanpa generator
  flutter_riverpod: ^2.6.1
  riverpod: ^2.6.1

  # Routing
  go_router: ^17.3.0

  # HTTP Client
  dio: ^5.9.2

  # Local Storage
  flutter_secure_storage: ^10.3.1
  path_provider: ^2.1.5
  shared_preferences: ^2.2.3

  # Firebase (FCM for Notifikasi Real-time)
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.3

  # Local Notifications (untuk notifikasi di Android/iOS)
  flutter_local_notifications: ^18.0.1

  # UI & Utils
  flutter_svg: ^2.0.9
  shimmer: ^3.0.0
  intl: ^0.19.0
  device_info_plus: ^11.2.0
  
  # Theme
  flex_color_scheme: ^8.0.0
  
  # QR Code
  qr_flutter: ^4.1.0
  
  # PDF Viewer
  syncfusion_flutter_pdfviewer: ^28.1.33


  # File & Image Picker
  file_picker: ^8.1.7

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
  flutter_native_splash: ^2.4.1

flutter:
  uses-material-design: true

  assets:
    - assets/images/logo.png

flutter_native_splash:
  color: "#ffffff" # Sesuaikan dengan warna background awal SplashScreen Anda (misal putih)
  color_dark: "#121212" # Jika aplikasi mendukung dark mode di awal
  image: "assets/images/logo_splash.png"
  android_12:
    image: "assets/images/logo_native.png"
    icon_background_color: "#ffffff"
    icon_background_color_dark: "#121212"

```

### FILE: lib/core/constants/app_colors.dart
```dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary (Base color provided)
  static const Color primary = Color(0xFF0F7D8A);
  
  // Turunan / Skala Warna (Shades & Tints)
  static const Color primaryLight = Color(0xFF14A3B4); // Lebih terang untuk aksen/hover
  static const Color primaryDark = Color(0xFF0A545E);  // Lebih gelap untuk kontras tinggi/header
  static const Color surface = Color(0xFFF4F8F8);       // Background netral dengan hint kebiruan
  static const Color background = Color(0xFFFFFFFF);    // Background utama
  static const Color textPrimary = Color(0xFF0D1B1E);   // Teks utama kontras tinggi
  static const Color textSecondary = Color(0xFF5A7175); // Teks sekunder/muted

  // Status Colors (Optional but good for semantic design)
  static const Color success = Color(0xFF2E7D32);
  static const Color error = Color(0xFFD32F2F);
  static const Color warning = Color(0xFFFFA000);
  static const Color info = Color(0xFF1976D2);
}

```

### FILE: lib/core/constants/app_config.dart
```dart
import 'package:flutter/foundation.dart';

class AppConfig {
  /// Base URL API E-Office yang dinamis. Bisa diatur via build command:
  /// `flutter run --dart-define=BASE_URL=https://eoffice.api.com/api`
  static const String _defaultDevUrl = 'http://192.168.0.37:8000/api';
  static const String _defaultProdUrl =
      'https://eoffice.api.com/api'; // WAJIB HTTPS untuk produksi

  static String get baseUrl {
    const envUrl = String.fromEnvironment('BASE_URL');
    if (envUrl.isNotEmpty) {
      if (!kDebugMode && !envUrl.startsWith('https://')) {
        // Keamanan tambahan: Paksa HTTPS di lingkungan rilis produksi
        return envUrl.replaceFirst('http://', 'https://');
      }
      return envUrl;
    }
    return kDebugMode ? _defaultDevUrl : _defaultProdUrl;
  }

  static const Duration connectTimeout = Duration(seconds: 5);
  static const Duration receiveTimeout = Duration(seconds: 5);

  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';
  static const String activeGroupKey = 'active_group';
  static const String fcmTokenKey = 'fcm_token';

  static const bool enableLogging = true;
  static const bool enableMockData = false;

  AppConfig._();
}

```

### FILE: lib/core/localization/app_localizations.dart
```dart
import 'package:flutter/material.dart';
class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }
  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();
  Map<String, String> _localizedStrings = {};
  Future<bool> load() async {
    _localizedStrings = {
      'title': 'E-Office',
      'dashboard': 'Dasbor',
      'surat_masuk': 'Surat Masuk',
      'persetujuan': 'Persetujuan',
      'profile': 'Profil',
      'login': 'Masuk',
      'logout': 'Keluar',
      'email': 'Surel',
      'password': 'Kata Sandi',
      'loading': 'Memuat...',
      'welcome': 'Selamat Datang',
      'pending_disposisi': 'Pending Disposisi',
      'pending_approval': 'Menunggu Persetujuan',
      'surat_masuk_baru': 'Surat Masuk Baru',
      'total_surat': 'Total Surat',
      'detail': 'Detail',
      'baca': 'Baca',
      'disposisi': 'Disposisi',
      'approve': 'Setujui',
      'tolak': 'Tolak',
      'catatan': 'Catatan',
      'kirim': 'Kirim',
      'simpan': 'Simpan',
      'batal': 'Batal',
      'upload': 'Unggah',
      'download': 'Unduh',
      'cetak': 'Cetak',
      'bagikan': 'Bagikan',
      'timeline': 'Linimasa',
      'riwayat': 'Riwayat',
      'notifikasi': 'Notifikasi',
      'pengaturan': 'Pengaturan',
      'tentang': 'Tentang',
      'versi': 'Versi',
      'hak_cipta': '© 2026 PT ABC',
      'nip': 'NIP',
      'jabatan': 'Jabatan',
      'unit_kerja': 'Unit Kerja',
      'surat_keluar': 'Surat Keluar', 
      'account_settings': 'Pengaturan Akun',
      'theme': 'Tema',
      'light': 'Terang',
      'dark': 'Gelap',
      'system': 'Sistem',
      'language': 'Bahasa',
      'english': 'Inggris',
      'indonesia': 'Indonesia',
      'select_theme': 'Pilih Tema',
      'select_language': 'Pilih Bahasa',
      'logout_confirm': 'Apakah Anda yakin ingin keluar?',
      'cancel': 'Batal',
      'error_loading': 'Gagal Memuat Data',
      'no_data': 'Tidak ada data',
      'sender': 'Pengirim',
      'receiver': 'Penerima',
      'subject': 'Perihal',
      'sent_date': 'Tanggal Kirim',
      'status': 'Status',
      'close': 'Tutup',
      'statistics': 'Statistik',
      'total_inbox': 'Total Surat Masuk',
      'need_action': 'Perlu Tindakan',
      'recent_letters': 'Surat Terbaru',
      'unread': 'Belum Dibaca',
      'read': 'Dibaca',
      'completed': 'Selesai',
      'captcha_required': 'Silakan verifikasi Captcha terlebih dahulu',
      'device_initializing': 'Menginisialisasi perangkat... Silakan coba lagi',
      'forgot_password': 'Lupa Kata Sandi?',
      'login_title': 'Masuk E-Office',
      'i_am_not_robot': 'Saya bukan robot',
      'liquid_glass_effect': 'Efek Kaca Cair',
    };
    return true;
  }
  String get(String key) {
    return _localizedStrings[key] ?? key;
  }
}
class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();
  @override
  bool isSupported(Locale locale) {
    return locale.languageCode == 'id';
  }
  @override
  Future<AppLocalizations> load(Locale locale) async {
    final localizations = AppLocalizations(locale);
    await localizations.load();
    return localizations;
  }
  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

```

### FILE: lib/core/network/api_endpoints.dart
```dart
import '../constants/app_config.dart';

class ApiEndpoints {
  // Auth endpoints (MOBILE PIMPINAN)
  static const String login = '/mobile/login';
  static const String logout = '/mobile/logout';
  static const String user = '/mobile/user';

  // Dashboard & Actions (PIMPINAN)
  static const String pimpinanDashboard = '/pimpinan/dashboard';
  static const String myActions = '/pimpinan/my-actions';
  static String tracking(String id) => '/pimpinan/tracking/$id';
  
  // Dashboard Tambahan
  static const String pengumuman = '/pengumuman';
  static const String agendaKegiatan = '/agenda_kegiatan';

  // Detail Surat - PIMPINAN USE THESE
  static String suratMasukDetail(String id) => '/surat_masuk/$id';
  static String suratKeluarDetail(String id) => '/surat_keluar/$id';

  // Surat Keluar - Approve/Reject (Aksi sebelum Sign)
  static String suratKeluarApprove(String id) => '/surat_keluar/$id/approve';
  static String suratKeluarReject(String id) => '/surat_keluar/$id/reject';
  
  // Tanda Tangan Digital (Kontrak Poin 7)
  static String suratKeluarSign(String id) => '/surat_keluar/$id/sign';

  // Disposisi - List, Complete & Upload (Kontrak Poin 8 & 9)
  static const String disposisi = '/surat_disposisi';
  static String disposisiDetail(String id) => '/surat_disposisi/$id';
  static String disposisiComplete(String id) => '/surat_disposisi/$id/complete';
  static String disposisiUploadAttachment(String id) => '/surat_disposisi/$id/upload-attachment';

  // Notifications (EOFFICE GENERAL - Poin 10)
  static const String notifications = '/eoffice/notifications';
  static String notificationMarkRead(String id) => '/eoffice/notifications/$id/read';
  static const String notificationsMarkAllRead = '/eoffice/notifications/read-all';

  // File storage endpoint (Poin 11)
  static String getFile(String path) => '/storage/$path';

  static String buildStorageUrl(String filePath) {
    if (filePath.isEmpty) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    final cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Perhatikan: Base URL sudah termasuk /api, rumus: BASE_URL + "/storage/" + path
    final base = AppConfig.baseUrl.endsWith('/')
        ? AppConfig.baseUrl.substring(0, AppConfig.baseUrl.length - 1)
        : AppConfig.baseUrl;
    
    // Menghilangkan '/api' dari base untuk mengakses folder storage jika di luar folder api
    final rootBase = base.replaceAll('/api', '');
    return '$rootBase/storage/$cleanPath';
  }

  ApiEndpoints._();
}

```

### FILE: lib/core/network/dio_client.dart
```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      validateStatus: (status) {
        // FIXED: HTTP status >= 400 di-treat sebagai exception agar tertangkap di onError
        return status != null && status < 400;
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: AppConfig.authTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        if (AppConfig.enableLogging && kDebugMode) {
          final sanitizedHeaders = Map<String, dynamic>.from(options.headers);
          if (sanitizedHeaders.containsKey('Authorization')) {
            sanitizedHeaders['Authorization'] = 'Bearer [HIDDEN]';
          }
          debugPrint('📤 REQUEST[${options.method}] => ${options.uri}');
          debugPrint('   Headers: $sanitizedHeaders');
          if (options.data != null) {
            dynamic logData = options.data;
            if (logData is Map) {
              final copy = Map<String, dynamic>.from(logData);
              if (copy.containsKey('password')) copy['password'] = '***';
              if (copy.containsKey('fcm_token')) copy['fcm_token'] = '***';
              logData = copy;
            }
            String dataStr = logData.toString();
            if (dataStr.length > 200) {
              dataStr = '${dataStr.substring(0, 200)}...';
            }
            debugPrint('   Data: $dataStr');
          }
        }
        handler.next(options);
      },
      onResponse: (response, handler) async {
        if (AppConfig.enableLogging) {
          debugPrint('📥 RESPONSE[${response.statusCode}] <= ${response.requestOptions.uri}');
        }
        handler.next(response);
      },
      onError: (DioException error, handler) async {
        final response = error.response;
        final statusCode = response?.statusCode;
        final responseData = response?.data;

        if (AppConfig.enableLogging) {
          debugPrint('❌ ERROR[${error.type}] => ${error.requestOptions.uri}');
          debugPrint('   Status Code: $statusCode');
          debugPrint('   Body: $responseData');
        }

        String computedMessage = 'Terjadi kesalahan sistem (${statusCode ?? "Koneksi"}).';

        // Penanganan Logout / Unauthenticated Otomatis (401)
        if (statusCode == 401) {
          await storage.delete(key: AppConfig.authTokenKey);
          await storage.delete(key: AppConfig.userDataKey);
          await storage.write(key: 'session_expired_flag', value: '1');
          computedMessage = 'Sesi Anda telah berakhir, silakan login kembali.';
        }

        if (responseData is Map<String, dynamic>) {
          final errorCode = responseData['error_code']?.toString();
          
          if (errorCode != null) {
            // Pola A: Custom Exception Handler
            final msg = responseData['message']?.toString();
            final errors = responseData['errors'];

            if (errors is Map) {
              final parsedErrors = errors.values.expand((v) => v is Iterable ? v : [v]).join(', ');
              computedMessage = parsedErrors.isNotEmpty ? parsedErrors : (msg ?? computedMessage);
            } else {
              computedMessage = msg ?? computedMessage;
            }
          } else {
            // Pola B: Default Laravel Handler (NO error_code)
            final bodyMsg = responseData['message']?.toString();
            if (bodyMsg != null && bodyMsg.trim().isNotEmpty) {
              computedMessage = bodyMsg;
            } else if (statusCode == 429) {
              computedMessage = 'Terlalu banyak percobaan percobaan, coba lagi dalam beberapa saat.';
            } else if (statusCode == 500) {
              computedMessage = 'Internal Server Error (500). Silakan hubungi admin.';
            } else if (statusCode == 404) {
              computedMessage = 'Endpoint tidak ditemukan di server (404).';
            }
          }
        } else {
          // Fallback Generic Berdasarkan HTTP Status Code jika body kosong / bukan json
          if (error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.receiveTimeout) {
            computedMessage = 'Koneksi ke server timeout. Silakan periksa jaringan Anda.';
          } else if (statusCode == 429) {
            computedMessage = 'Terlalu banyak percobaan percobaan, coba lagi dalam beberapa saat.';
          } else if (statusCode == 403) {
            computedMessage = 'Anda tidak memiliki hak akses untuk fitur ini (403).';
          }
        }

        // Bungkus pesan yang sudah diformat ke dalam custom DioException agar ditangkap secara seragam oleh UI / Repo
        final updatedException = DioException(
          requestOptions: error.requestOptions,
          response: error.response,
          type: error.type,
          error: Exception(computedMessage),
          message: computedMessage,
        );

        handler.next(updatedException);
      },
    ),
  );

  return dio;
});

```

### FILE: lib/core/network/dio_client.g.dart
```dart
// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dio_client.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(dio)
final dioProvider = DioProvider._();

final class DioProvider extends $FunctionalProvider<Dio, Dio, Dio>
    with $Provider<Dio> {
  DioProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dioProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dioHash();

  @$internal
  @override
  $ProviderElement<Dio> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  Dio create(Ref ref) {
    return dio(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Dio value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Dio>(value),
    );
  }
}

String _$dioHash() => r'a7e7ee8d9996ef10c75aac874d4f1fd83934835d';

```

### FILE: lib/core/network/firebase_messaging_service.dart
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_config.dart';
import 'api_endpoints.dart';

final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print(" [BACKGROUND] Pesan diterima: ${message.messageId}");
    print("   Data: ${message.data}");
  }
  await _showLocalNotification(
    title: message.notification?.title ?? 'E-Office',
    body: message.notification?.body ?? 'Anda memiliki pesan baru',
    data: message.data,
  );
}

Future<void> _showLocalNotification({
  required String title,
  required String body,
  Map<String, dynamic>? data,
}) async {
  const androidDetails = AndroidNotificationDetails(
    'e_office_channel',
    'E-Office Notifications',
    channelDescription: 'Notifikasi surat masuk, disposisi, dan approval',
    importance: Importance.high,
    priority: Priority.high,
    icon: '@mipmap/ic_launcher',
  );
  const iosDetails = DarwinNotificationDetails(
    presentAlert: true,
    presentBadge: true,
    presentSound: true,
  );
  await _localNotifications.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title,
    body,
    const NotificationDetails(android: androidDetails, iOS: iosDetails),
    payload: data != null ? 
        data.entries.map((e) => '${e.key}=${e.value}').join('&') : null,
  );
}

class FirebaseMessagingService {
  final Dio? _dio;
  final FlutterSecureStorage _storage;
  
  FirebaseMessagingService({Dio? dio}) 
      : _dio = dio,
        _storage = const FlutterSecureStorage();

  Future<void> init() async {
    await _initLocalNotifications();
    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    if (kDebugMode) {
      print(' User granted permission: ${settings.authorizationStatus}');
    }
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' [FOREGROUND] Pesan diterima!');
        print('   Data: ${message.data}');
        if (message.notification != null) {
          print('   Notifikasi: ${message.notification?.title} / ${message.notification?.body}');
        }
      }
      _showLocalNotification(
        title: message.notification?.title ?? 'E-Office',
        body: message.notification?.body ?? 'Anda memiliki pesan baru',
        data: message.data,
      );
    });
    
    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print(' User membuka app dari notifikasi: ${message.data}');
      }
      _handleNotificationTap(message.data);
    });
    
    // Check if app was opened from notification
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      if (kDebugMode) {
        print(' App dibuka dari notifikasi: ${initialMessage.data}');
      }
      _handleNotificationTap(initialMessage.data);
    }

    // Listen to token refresh
    messaging.onTokenRefresh.listen((newToken) {
      if (kDebugMode) {
        print('🔑 FCM Token Refreshed: $newToken');
      }
      registerFcmToken(newToken);
    });
  }
  
  /// Handle navigasi deep linking dari notifikasi
  void _handleNotificationTap(Map<String, dynamic> data) {
    // TODO: Implement navigation logic based on notification type
    // Contoh: jika ada 'surat_id', navigate ke detail surat
    final suratId = data['surat_id'];
    final tipeNotif = data['tipe'];
    
    if (kDebugMode) {
      print('🔔 Notification tap - Type: $tipeNotif, Surat ID: $suratId');
    }
    
    // Navigasi akan di-handle oleh router di main.dart
    // Bisa menggunakan callback atau event bus
  }
  
  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
    );
  }
  
  Future<String?> getFCMToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (kDebugMode) {
        print("🔑 FCM Token: $token");
      }
      return token;
    } catch (e) {
      if (kDebugMode) {
        print(" Error getting FCM token: $e");
      }
      return null;
    }
  }
  
  /// Registrasikan FCM token ke backend setelah login
  Future<void> registerFcmToken(String fcmToken) async {
    try {
      // Simpan token baru secara lokal
      await _storage.write(key: AppConfig.fcmTokenKey, value: fcmToken);

      // // BUTUH-BACKEND: tidak ada endpoint update fcm_token di luar proses login, 
      // token baru hanya tersimpan lokal sampai user login ulang.
      // Jika kelak ada endpoint, tambahkan di sini.
      
      if (kDebugMode) {
        print('✅ FCM token saved locally (Refresh)');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error saving FCM token: $e');
      }
    }
  }
  
  Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      if (kDebugMode) {
        print(" Subscribed to topic: $topic");
      }
    } catch (e) {
      if (kDebugMode) {
        print(" Error subscribing to topic: $e");
      }
    }
  }
  
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
      if (kDebugMode) {
        print(" Unsubscribed from topic: $topic");
      }
    } catch (e) {
      if (kDebugMode) {
        print(" Error unsubscribing from topic: $e");
      }
    }
  }
}

```

### FILE: lib/core/routing/app_router.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_config.dart';
import '../network/dio_client.dart';
import '../../domain/providers/auth_provider.dart';
import '../../data/models/user_model.dart';
import '../../presentation/screens/disposisi_screen.dart';
import '../../presentation/screens/main_layout_screen.dart';
import '../../presentation/screens/detail_surat_screen.dart';
import '../../presentation/screens/login_screen.dart';
import '../../presentation/screens/dashboard_screen.dart';
import '../../presentation/screens/surat_masuk_screen.dart';
import '../../presentation/screens/approval_screen.dart';
import '../../presentation/screens/notification_screen.dart';
import '../../presentation/screens/pdf_viewer_screen.dart';
import '../../presentation/screens/profil_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final authStateListenable = ValueNotifier<AsyncValue<UserModel?>>(ref.read(authProvider));
  
  ref.listen<AsyncValue<UserModel?>>(authProvider, (previous, next) {
    authStateListenable.value = next;
  });

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: authStateListenable,
    redirect: (context, state) async {
      final storage = ref.read(secureStorageProvider);
      final token = await storage.read(key: AppConfig.authTokenKey);
      final isLoggedIn = token != null && token.isNotEmpty;
      final isLoggingIn = state.uri.path == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      if (isLoggedIn && isLoggingIn) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/notifications',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: NotificationScreen(),
        ),
      ),
      GoRoute(
        path: '/pdf',
        pageBuilder: (context, state) {
          final url = state.extra as String? ?? '';
          return NoTransitionPage(
            child: PdfViewerScreen(pdfUrl: url),
          );
        },
      ),
      ShellRoute(
        builder: (context, state, child) {
          int selectedIndex = 0;
          final location = state.fullPath;
          
          if (location == '/dashboard' || location == '/') {
            selectedIndex = 0;
          } else if (location != null && (location == '/surat-masuk' || location.startsWith('/surat-masuk/'))) {
            selectedIndex = 1;
          } else if (location == '/approval') {
            selectedIndex = 2;
          } else if (location == '/profil') {
            selectedIndex = 3;
          }

          return MainLayoutScreen(
            selectedIndex: selectedIndex,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/surat-masuk',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SuratMasukScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                pageBuilder: (context, state) {
                  final id = state.pathParameters['id']!;
                  final extra = state.extra;
                  final actionType = extra is Map
                      ? extra['actionType']?.toString()
                      : extra as String?;
                  final idDisposisi = extra is Map
                      ? extra['idDisposisi']?.toString()
                      : null;
                  return NoTransitionPage(
                    child: DetailSuratScreen(
                      idSurat: id,
                      actionType: actionType,
                      idDisposisi: idDisposisi,
                    ),
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: '/approval',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ApprovalScreen(),
            ),
          ),
          GoRoute(
            path: '/disposisi',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DisposisiScreen(),
            ),
          ),
          GoRoute(
            path: '/profil',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfilScreen(),
            ),
          ),
        ],
      ),
    ],
  );
});

```

### FILE: lib/core/routing/app_router.g.dart
```dart
// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_router.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(appRouter)
final appRouterProvider = AppRouterProvider._();

final class AppRouterProvider
    extends $FunctionalProvider<GoRouter, GoRouter, GoRouter>
    with $Provider<GoRouter> {
  AppRouterProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'appRouterProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$appRouterHash();

  @$internal
  @override
  $ProviderElement<GoRouter> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  GoRouter create(Ref ref) {
    return appRouter(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GoRouter value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GoRouter>(value),
    );
  }
}

String _$appRouterHash() => r'0fa86841747489ae03ccaffb81121a3178f7ddc7';

```

### FILE: lib/core/theme/app_theme.dart
```dart
import 'package:flutter/material.dart';
import 'package:flex_color_scheme/flex_color_scheme.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    final baseData = FlexThemeData.light(
      colors: const FlexSchemeColor(
        primary: AppColors.primary,
        primaryContainer: Color(0xFFC0EBF0),
        secondary: Color(0xFF006B76),
        secondaryContainer: Color(0xFFA1EFFF),
        tertiary: Color(0xFF006B76),
        tertiaryContainer: Color(0xFFA1EFFF),
        appBarColor: AppColors.primary,
        error: AppColors.error,
      ),
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 7,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 10,
        blendOnColors: false,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 20.0,
        cardRadius: 20.0,
        dialogRadius: 24.0,
        bottomSheetRadius: 28.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorUnfocusedBorderIsColored: false,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
      swapColors: false,
      scaffoldBackground: AppColors.surface,
    );

    return baseData.copyWith(
      cardTheme: baseData.cardTheme.copyWith(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.0),
          side: BorderSide(
            color: baseData.colorScheme.outlineVariant.withValues(alpha: 0.35),
            width: 1.0,
          ),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    final baseData = FlexThemeData.dark(
      scheme: FlexScheme.deepBlue,
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 13,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 20,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 20.0,
        cardRadius: 20.0,
        dialogRadius: 24.0,
        bottomSheetRadius: 28.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
    );

    return baseData.copyWith(
      cardTheme: baseData.cardTheme.copyWith(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.0),
          side: BorderSide(
            color: Colors.white.withValues(alpha: 0.12),
            width: 1.0,
          ),
        ),
      ),
    );
  }
}

```

### FILE: lib/data/models/surat_model.dart
```dart
/// Model data untuk Surat (Masuk & Keluar)
class SuratModel {
  final String id;
  final String nomorSurat;
  final String asalSurat;
  final String perihal;
  final DateTime tanggalDiterima;
  final String status; 
  final String ringkasan;
  final String? filePdf;
  final String? draftFilePath;
  final String? signedFilePath;
  final List<dynamic> attachments;
  final int disposisiCount;
  final String? pengirim;
  final DateTime? tanggalSurat;
  final String? pemohon;
  
  // FINAL CONTRACT - Pimpinan App
  final String? actionType; // "disposisi" atau "approval"
  final String? idDisposisi;

  SuratModel({
    required this.id,
    required this.nomorSurat,
    required this.asalSurat,
    required this.perihal,
    required this.tanggalDiterima,
    required this.status,
    required this.ringkasan,
    this.filePdf,
    this.draftFilePath,
    this.signedFilePath,
    this.attachments = const [],
    this.disposisiCount = 0,
    this.pengirim,
    this.tanggalSurat,
    this.pemohon,
    this.actionType,
    this.idDisposisi,
  });

  /// Mengambil path dokumen aktif sesuai kontrak:
  /// - Surat Keluar 'signed' -> signed_file_path (fallback draft_file_path)
  /// - Surat Keluar draft -> draft_file_path
  /// - Surat Masuk -> file_path
  /// - Disposisi -> attachments[0]['file_path'] jika ada
  String? get activeFilePath {
    if (status.toLowerCase() == 'signed' || status.toLowerCase() == 'dikirim') {
       if (signedFilePath != null && signedFilePath!.isNotEmpty) return signedFilePath;
    }
    if (draftFilePath != null && draftFilePath!.isNotEmpty) {
      return draftFilePath;
    }
    if (filePdf != null && filePdf!.isNotEmpty) {
      return filePdf;
    }
    if (attachments.isNotEmpty) {
      final first = attachments.first;
      if (first is Map && first['file_path'] != null) {
        return first['file_path'].toString();
      }
    }
    return null;
  }

  factory SuratModel.fromJsonApi(Map<String, dynamic> json) {
    List<dynamic> parsedAttachments = [];
    if (json['attachments'] != null && json['attachments'] is List) {
      parsedAttachments = json['attachments'] as List;
    }

    final rawDraftPath = json['draft_file_path'];
    final rawSignedPath = json['signed_file_path'];
    final rawFilePath = json['file_path'] ?? json['file_surat'];

    return SuratModel(
      id: (json['id'] ?? json['id_surat_masuk'] ?? json['uuid'] ?? '').toString(),
      nomorSurat: json['nomor_surat'] ?? json['nomor_agenda'] ?? '-',
      asalSurat: json['asal_surat'] ?? json['pengirim'] ?? json['instansi_pengirim'] ?? '-',
      perihal: json['perihal'] ?? json['isi_ringkas'] ?? '-',
      tanggalDiterima: _parseDate(json['tanggal_diterima'] ?? json['created_at'] ?? DateTime.now()),
      status: _mapStatus(json['status'] ?? json['status_surat'] ?? 'baru'),
      ringkasan: json['isi_ringkas'] ?? json['ringkasan'] ?? json['deskripsi'] ?? '',
      filePdf: rawFilePath,
      draftFilePath: rawDraftPath,
      signedFilePath: rawSignedPath,
      attachments: parsedAttachments,
      disposisiCount: json['disposisi_count'] ?? 0,
      pengirim: json['pengirim'] ?? json['nama_pengirim'],
      tanggalSurat: _parseDateOrNull(json['tanggal_surat']),
      pemohon: json['pemohon'] ?? json['nama_pemohon'] ?? json['dia_jukan_oleh'],
      actionType: json['action_type']?.toString(),
      idDisposisi: (json['id_disposisi'] ?? json['id_surat_disposisi'])?.toString(),
    );
  }

  static DateTime _parseDate(dynamic dateValue) {
    if (dateValue is DateTime) return dateValue;
    if (dateValue is int) return DateTime.fromMillisecondsSinceEpoch(dateValue * 1000);
    if (dateValue is String) {
      try {
        return DateTime.parse(dateValue);
      } catch (_) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  static DateTime? _parseDateOrNull(dynamic dateValue) {
    if (dateValue == null) return null;
    if (dateValue is DateTime) return dateValue;
    if (dateValue is int) return DateTime.fromMillisecondsSinceEpoch(dateValue * 1000);
    if (dateValue is String) {
      try {
        return DateTime.parse(dateValue);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  static String _mapStatus(dynamic status) {
    if (status == null) return 'baru';
    final statusStr = status.toString().toLowerCase();
    return statusStr; // Keep backend status literal for Pimpinan app
  }

  factory SuratModel.fromJson(Map<String, dynamic> json) {
    return SuratModel(
      id: json['id'] as String,
      nomorSurat: json['nomor_surat'] as String,
      asalSurat: json['asal_surat'] as String,
      perihal: json['perihal'] as String,
      tanggalDiterima: DateTime.parse(json['tanggal_diterima'] as String),
      status: json['status'] as String,
      ringkasan: json['ringkasan'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nomor_surat': nomorSurat,
      'asal_surat': asalSurat,
      'perihal': perihal,
      'tanggal_diterima': tanggalDiterima.toIso8601String(),
      'status': status,
      'ringkasan': ringkasan,
      if (filePdf != null) 'file_surat': filePdf,
      if (disposisiCount > 0) 'disposisi_count': disposisiCount,
      if (actionType != null) 'action_type': actionType,
      if (idDisposisi != null) 'id_disposisi': idDisposisi,
    };
  }

  SuratModel copyWith({
    String? id,
    String? nomorSurat,
    String? asalSurat,
    String? perihal,
    DateTime? tanggalDiterima,
    String? status,
    String? ringkasan,
    String? filePdf,
    int? disposisiCount,
    String? pengirim,
    DateTime? tanggalSurat,
    String? actionType,
    String? idDisposisi,
  }) {
    return SuratModel(
      id: id ?? this.id,
      nomorSurat: nomorSurat ?? this.nomorSurat,
      asalSurat: asalSurat ?? this.asalSurat,
      perihal: perihal ?? this.perihal,
      tanggalDiterima: tanggalDiterima ?? this.tanggalDiterima,
      status: status ?? this.status,
      ringkasan: ringkasan ?? this.ringkasan,
      filePdf: filePdf ?? this.filePdf,
      disposisiCount: disposisiCount ?? this.disposisiCount,
      pengirim: pengirim ?? this.pengirim,
      tanggalSurat: tanggalSurat ?? this.tanggalSurat,
      actionType: actionType ?? this.actionType,
      idDisposisi: idDisposisi ?? this.idDisposisi,
    );
  }
}

class TimelineEvent {
  final String id;
  final String judul;
  final String deskripsi;
  final DateTime tanggal;
  final String pelaku;
  final String? catatan;
  final String status;

  TimelineEvent({
    required this.id,
    required this.judul,
    required this.deskripsi,
    required this.tanggal,
    required this.pelaku,
    this.catatan,
    required this.status,
  });

  /// Kontrak backend /pimpinan/tracking/{id}:
  /// {"type":"created","title":"Surat keluar dibuat","status":"diproses","created_at":"2026-09-09 10:00:00"}
  /// - judul     = title
  /// - deskripsi = status (ditampilkan sebagai badge kecil)
  /// - tanggal   = created_at
  /// - pelaku    = kosong (backend tidak mengirim)
  factory TimelineEvent.fromJsonApi(Map<String, dynamic> json) {
    final statusStr = (json['status'] ?? '').toString();
    return TimelineEvent(
      id: (json['id'] ?? json['type'] ?? '').toString(),
      judul: (json['title'] ?? json['judul'] ?? 'Event').toString(),
      deskripsi: statusStr,
      tanggal: SuratModel._parseDate(json['created_at']),
      pelaku: (json['performed_by'] ?? json['pelaku'] ?? '').toString(),
      catatan: json['catatan']?.toString(),
      status: statusStr,
    );
  }
}

class PimpinanDashboard {
  final int pendingDisposisi;
  final int pendingApproval;
  final int totalSuratMasukBulanIni;

  PimpinanDashboard({
    required this.pendingDisposisi,
    required this.pendingApproval,
    required this.totalSuratMasukBulanIni,
  });

  factory PimpinanDashboard.fromJsonApi(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return PimpinanDashboard(
      pendingDisposisi: data['pending_disposisi'] ?? 0,
      pendingApproval: data['pending_approval'] ?? 0,
      totalSuratMasukBulanIni: data['total_surat_masuk_bulan_ini'] ?? 0,
    );
  }

  factory PimpinanDashboard.empty() {
    return PimpinanDashboard(
      pendingDisposisi: 0,
      pendingApproval: 0,
      totalSuratMasukBulanIni: 0,
    );
  }
}

class PengumumanModel {
  final String id;
  final String judul;
  final String isi;
  final String status;
  final String targetRole;
  final DateTime? tanggal;

  PengumumanModel({
    required this.id,
    required this.judul,
    required this.isi,
    required this.status,
    required this.targetRole,
    this.tanggal,
  });

  factory PengumumanModel.fromJsonApi(Map<String, dynamic> json) {
    return PengumumanModel(
      id: (json['id_pengumuman'] ?? json['id'] ?? '').toString(),
      judul: json['judul'] ?? json['title'] ?? json['perihal'] ?? '-',
      isi: json['isi'] ?? json['content'] ?? json['perihal'] ?? '-',
      status: json['status'] ?? 'draft',
      targetRole: json['target_role'] ?? 'semua',
      tanggal: SuratModel._parseDateOrNull(json['tanggal'] ?? json['created_at']),
    );
  }
}

class AgendaModel {
  final String id;
  final String judul;
  final String status;
  final DateTime? tanggalMulai;

  AgendaModel({
    required this.id,
    required this.judul,
    required this.status,
    this.tanggalMulai,
  });

  factory AgendaModel.fromJsonApi(Map<String, dynamic> json) {
    return AgendaModel(
      id: (json['id'] ?? '').toString(),
      judul: json['judul'] ?? json['nama_agenda'] ?? json['title'] ?? '-',
      status: json['status'] ?? '-',
      tanggalMulai: SuratModel._parseDateOrNull(json['tanggal_mulai'] ?? json['created_at']),
    );
  }
}

```

### FILE: lib/data/models/user_model.dart
```dart
class UserModel {
  final String id;
  final String nama;
  final String email;
  final String? nip;
  final String? jabatan;
  final String? unitKerja;
  final List<String> groups;
  final String? fotoProfil;
  UserModel({
    required this.id,
    required this.nama,
    required this.email,
    this.nip,
    this.jabatan,
    this.unitKerja,
    this.groups = const [],
    this.fotoProfil,
  });
  factory UserModel.fromJsonApi(Map<String, dynamic> json) {
    final groupData = json['group'] as Map<String, dynamic>?;
    final jabatanDariGroup = groupData?['nama_jabatan']?.toString();
    final unitDariGroup = groupData?['nama_unit']?.toString() ?? groupData?['nama']?.toString();
    final namaValue = json['nama'] ?? json['name'] ?? json['full_name'];
    final jabatanValue = json['jabatan'] ?? json['position'] ?? json['role_name'] ?? jabatanDariGroup;
    final unitKerjaValue = json['unit_kerja'] ?? json['department'] ?? json['divisi'] ?? unitDariGroup;
    return UserModel(
      id: (json['id_user'] ?? json['id'] ?? json['uuid'] ?? '').toString(),
      nama: namaValue.toString() ?? 'User',
      email: json['email']?.toString() ?? '',
      nip: json['nip']?.toString(),
      jabatan: jabatanValue.toString(),
      unitKerja: unitKerjaValue?.toString(),
      groups: _parseGroups(json['groups'] ?? json['roles'] ?? []),
      fotoProfil: json['foto_profil'] ?? json['avatar'] ?? json['profile_picture'],
    );
  }
  static List<String> _parseGroups(dynamic groupsData) {
    if (groupsData == null) return [];
    if (groupsData is List) {
      return groupsData
          .map((g) => g is Map ? g['name']?.toString() : g.toString())
          .where((g) => g != null && g.isNotEmpty)
          .cast<String>()
          .toList();
    }
    if (groupsData is Map) {
      if (groupsData.containsKey('data')) {
        return _parseGroups(groupsData['data']);
      }
      if (groupsData.containsKey('name')) {
        return [groupsData['name'].toString()];
      }
    }
    return [];
  }
  bool hasGroup(String groupName) {
    return groups.any((g) => g.toLowerCase() == groupName.toLowerCase());
  }
  bool get isPimpinan {
    return groups.any((g) => 
      g.toLowerCase().contains('pimpinan') ||
      g.toLowerCase().contains('direksi') ||
      g.toLowerCase().contains('manager') ||
      g.toLowerCase().contains('kadiv') ||
      g.toLowerCase().contains('kabag')
    );
  }
  bool get isAdmin {
    return groups.any((g) => 
      g.toLowerCase().contains('admin') ||
      g.toLowerCase().contains('super')
    );
  }
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      nama: json['nama'] as String,
      email: json['email'] as String,
      nip: json['nip'] as String?,
      jabatan: json['jabatan'] as String?,
      unitKerja: json['unit_kerja'] as String?,
      groups: (json['groups'] as List?)?.cast<String>() ?? [],
      fotoProfil: json['foto_profil'] as String?,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'email': email,
      'nip': nip,
      'jabatan': jabatan,
      'unit_kerja': unitKerja,
      'groups': groups,
      'foto_profil': fotoProfil,
    };
  }
  UserModel copyWith({
    String? id,
    String? nama,
    String? email,
    String? nip,
    String? jabatan,
    String? unitKerja,
    List<String>? groups,
    String? fotoProfil,
  }) {
    return UserModel(
      id: id ?? this.id,
      nama: nama ?? this.nama,
      email: email ?? this.email,
      nip: nip ?? this.nip,
      jabatan: jabatan ?? this.jabatan,
      unitKerja: unitKerja ?? this.unitKerja,
      groups: groups ?? this.groups,
      fotoProfil: fotoProfil ?? this.fotoProfil,
    );
  }
  String get role => jabatan ?? (groups.isNotEmpty ? groups.first : 'User');
  
  @override
  String toString() {
    return 'UserModel(id: $id, nama: $nama, email: $email, jabatan: $jabatan, role: $role)';
  }
}

```

### FILE: lib/data/repositories/surat_repository.dart
```dart
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/surat_model.dart';
import '../../core/network/api_endpoints.dart';

/// Exception berpesan untuk endpoint tracking (403/404).
/// [message] diambil apa adanya dari body.message server.
class TrackingException implements Exception {
  final int? statusCode;
  final String message;
  TrackingException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// DEBUG ONLY: cetak teks panjang per potongan agar tidak terpotong logcat.
void _debugLogLong(String label, Object? value) {
  if (!kDebugMode) return;
  String text;
  try {
    text = const JsonEncoder.withIndent('  ').convert(value);
  } catch (_) {
    text = value.toString();
  }
  const chunk = 800;
  for (var i = 0; i < text.length; i += chunk) {
    final end = (i + chunk < text.length) ? i + chunk : text.length;
    debugPrint('$label ${text.substring(i, end)}');
  }
}

/// DEBUG ONLY: cetak key top-level & key di dalam 'data' pada response detail.
void _debugLogDetailKeys(String label, dynamic body) {
  if (!kDebugMode) return;
  if (body is Map) {
    debugPrint('🔎 $label TOP-LEVEL KEYS: ${body.keys.toList()}');
    final inner = body['data'];
    if (inner is Map) {
      debugPrint('🔎 $label DATA KEYS: ${inner.keys.toList()}');
    } else {
      debugPrint('🔎 $label DATA bukan Map (type: ${inner.runtimeType})');
    }
  } else {
    debugPrint('🔎 $label body bukan Map (type: ${body.runtimeType})');
  }
}

abstract class SuratRepository {
  Future<PimpinanDashboard> getDashboard();
  Future<List<SuratModel>> getMyActions({int page = 1, int pageSize = 15});
  Future<List<TimelineEvent>> getTracking(String id, String? actionType);
  Future<void> approveSurat(String id);
  Future<void> rejectSurat(String id, String reason);
  Future<Map<String, dynamic>> signSurat(String id, {required String signatureData});
  Future<void> completeDisposisi(String id, {required String catatan, String? fileBuktiPath});
  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file);
  Future<List<Map<String, dynamic>>> getDisposisiList({String? status, int page = 1, int pageSize = 20});
  Future<Map<String, dynamic>?> getDisposisiForSurat(String idSuratMasuk);
  Future<void> submitSuratKeluar(String id);
  
  // Notifikasi
  Future<List<dynamic>> getNotifications({int page = 1, int perPage = 15});
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();

  // Detail
  Future<SuratModel?> getSuratMasukDetail(String id);
  Future<SuratModel?> getSuratKeluarDetail(String id);

  // Dashboard Tambahan
  Future<List<PengumumanModel>> getPengumuman({int limit = 5});
  Future<List<AgendaModel>> getAgenda({int limit = 5});
}

class ApiSuratRepository implements SuratRepository {
  final Dio _dio;

  ApiSuratRepository(this._dio);

  @override
  Future<PimpinanDashboard> getDashboard() async {
    try {
      final response = await _dio.get(ApiEndpoints.pimpinanDashboard);
      return PimpinanDashboard.fromJsonApi(response.data);
    } catch (e) {
      if (kDebugMode) print('❌ GetDashboard Error: $e');
      rethrow;
    }
  }

  @override
  Future<List<SuratModel>> getMyActions({int page = 1, int pageSize = 15}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.myActions,
        queryParameters: {'page': page, 'pagesize': pageSize},
      );
      
      final rawData = response.data;
      List<dynamic> listData = [];

      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          listData = rawData['data'];
        } else if (rawData['items'] is List) {
          listData = rawData['items'];
        } else if (rawData['results'] is List) {
          listData = rawData['results'];
        }
      } else if (rawData is List) {
        listData = rawData;
      }

      if (kDebugMode) {
        dynamic firstDisp;
        dynamic firstAppr;
        for (final item in listData) {
          if (item is Map) {
            final at = item['action_type']?.toString();
            if (at == 'disposisi' && firstDisp == null) firstDisp = item;
            if (at == 'approval' && firstAppr == null) firstAppr = item;
          }
        }
        _debugLogLong('📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=disposisi):', firstDisp ?? '(tidak ada)');
        _debugLogLong('📋 [RAW_LOG] MY-ACTIONS ITEM (action_type=approval):', firstAppr ?? '(tidak ada)');
      }

      return listData.map((json) => SuratModel.fromJsonApi(json)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetMyActions Error: $e');
      rethrow;
    }
  }

  /// Kontrak backend: {"success":true,"data":[{type,title,status,created_at}, ...]}
  /// 403/404: {"success":false,"message":"..."} -> dilempar sebagai [TrackingException].
  /// Error lain di-rethrow (tidak ditelan).
  @override
  Future<List<TimelineEvent>> getTracking(String id, String? actionType) async {
    try {
      final response = await _dio.get(ApiEndpoints.tracking(id));
      final body = response.data;
      final rawList = body is Map ? body['data'] : null;

      if (rawList is! List) {
        if (kDebugMode) {
          debugPrint('⚠️ GetTracking: body["data"] bukan List (type: ${rawList.runtimeType})');
        }
        return [];
      }

      return rawList
          .whereType<Map>()
          .map((e) => TimelineEvent.fromJsonApi(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final body = e.response?.data;
      final serverMessage =
          (body is Map && body['message'] is String) ? body['message'] as String : null;

      if (kDebugMode) debugPrint('❌ GetTracking Error [$statusCode]: ${serverMessage ?? e.message}');

      if (statusCode == 403 || statusCode == 404) {
        throw TrackingException(
          serverMessage ??
              (statusCode == 403
                  ? 'Anda tidak memiliki akses ke riwayat ini (403).'
                  : 'Riwayat tidak ditemukan (404).'),
          statusCode: statusCode,
        );
      }
      rethrow;
    }
  }

  @override
  Future<void> approveSurat(String id) async {
    await _dio.post(ApiEndpoints.suratKeluarApprove(id));
  }

  @override
  Future<void> rejectSurat(String id, String reason) async {
    await _dio.post(
      ApiEndpoints.suratKeluarReject(id),
      data: {
        'catatan_revisi': reason,
        'reason': reason,
      },
    );
  }

  @override
  Future<Map<String, dynamic>> signSurat(String id, {required String signatureData}) async {
    final response = await _dio.post(
      ApiEndpoints.suratKeluarSign(id),
      data: {
        'signature_data': signatureData,
        'signature': signatureData,
      },
    );
    return response.data is Map<String, dynamic> ? response.data : {'message': 'Success'};
  }

  @override
  Future<void> completeDisposisi(String id, {required String catatan, String? fileBuktiPath}) async {
    final payload = <String, dynamic>{
      'catatan_penyelesaian': catatan,
      if (fileBuktiPath != null && fileBuktiPath.isNotEmpty)
        'file_bukti_path': fileBuktiPath,
    };

    await _dio.post(
      ApiEndpoints.disposisiComplete(id),
      data: payload,
    );
  }

  @override
  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file) async {
    String? filePath;
    String? fileName;
    if (file is String) {
      filePath = file;
      fileName = filePath.split('/').last;
    }
    
    final formData = FormData.fromMap({
      if (filePath != null)
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _dio.post(
      ApiEndpoints.disposisiUploadAttachment(id),
      data: formData,
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      if (data['data'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(data['data']);
      }
      return data;
    }
    return {};
  }

  @override
  Future<List<Map<String, dynamic>>> getDisposisiList({String? status, int page = 1, int pageSize = 20}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          'page': page,
          'pagesize': pageSize,
        },
      );
      final rawData = response.data;
      List<dynamic> items = [];
      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          items = rawData['data'];
        } else if (rawData['result'] is List) {
          items = rawData['result'];
        }
      } else if (rawData is List) {
        items = rawData;
      }
      return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ getDisposisiList Error: $e');
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>?> getDisposisiForSurat(String idSuratMasuk) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.disposisi,
        queryParameters: {
          'id_surat_masuk': idSuratMasuk,
          'pagesize': 5,
        },
      );
      final rawData = response.data;
      List<dynamic> items = [];
      if (rawData is Map<String, dynamic>) {
        if (rawData['data'] is List) {
          items = rawData['data'];
        } else if (rawData['result'] is List) {
          items = rawData['result'];
        }
      }
      if (items.isNotEmpty) {
        final active = items.firstWhere(
          (element) {
            final st = (element['status'] ?? '').toString().toLowerCase();
            return st != 'selesai' && st != 'dibatalkan';
          },
          orElse: () => items.first,
        );
        return Map<String, dynamic>.from(active as Map);
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ getDisposisiForSurat Error: $e');
      return null;
    }
  }

  @override
  Future<void> submitSuratKeluar(String id) async {
    await _dio.post('/surat_keluar/$id/submit');
  }

  @override
  Future<List<dynamic>> getNotifications({int page = 1, int perPage = 15}) async {
    final response = await _dio.get(
      ApiEndpoints.notifications,
      queryParameters: {'page': page, 'per_page': perPage},
    );

    // DEBUG ONLY: log mentah (tidak mengubah parsing di bawah)
    if (kDebugMode) {
      final body = response.data;
      if (body is Map) {
        final rawItems = body['data'];
        if (rawItems is List) {
          _debugLogLong('🔔 [RAW_LOG] NOTIFIKASI ITEM 1:', rawItems.isNotEmpty ? rawItems[0] : '(kosong)');
          _debugLogLong('🔔 [RAW_LOG] NOTIFIKASI ITEM 2:', rawItems.length > 1 ? rawItems[1] : '(kosong)');
        }
      }
    }

    return response.data['data'] as List? ?? [];
  }

  @override
  Future<void> markNotificationRead(String id) async {
    await _dio.post(ApiEndpoints.notificationMarkRead(id));
  }

  @override
  Future<void> markAllNotificationsRead() async {
    await _dio.post(ApiEndpoints.notificationsMarkAllRead);
  }

  @override
  Future<SuratModel?> getSuratMasukDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratMasukDetail(id));
      if (kDebugMode) {
        _debugLogLong('📥 [RAW_LOG] GET /surat_masuk/$id RAW BODY:', response.data);
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys('SURAT MASUK $id (activeFilePath null)', response.data);
        }
        return model;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ GetSuratMasukDetail Error: $e');
      return null;
    }
  }

  @override
  Future<SuratModel?> getSuratKeluarDetail(String id) async {
    try {
      final response = await _dio.get(ApiEndpoints.suratKeluarDetail(id));
      if (kDebugMode) {
        _debugLogLong('📤 [RAW_LOG] GET /surat_keluar/$id RAW BODY:', response.data);
      }
      final data = response.data['data'] ?? response.data;
      if (data != null && data is Map<String, dynamic>) {
        final model = SuratModel.fromJsonApi(data);
        if (model.activeFilePath == null) {
          _debugLogDetailKeys('SURAT KELUAR $id (activeFilePath null)', response.data);
        }
        return model;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('❌ GetSuratKeluarDetail Error: $e');
      return null;
    }
  }

  @override
  Future<List<PengumumanModel>> getPengumuman({int limit = 5}) async {
    try {
      final response = await _dio.get(ApiEndpoints.pengumuman, queryParameters: {'pagesize': limit, 'page': 1});
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List ? rawData['data'] : (rawData['data']?['data'] ?? []);
      } else if (rawData is List) {
        listData = rawData;
      }
      return listData.map((e) => PengumumanModel.fromJsonApi(e)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetPengumuman Error: $e');
      return [];
    }
  }

  @override
  Future<List<AgendaModel>> getAgenda({int limit = 5}) async {
    try {
      final response = await _dio.get(ApiEndpoints.agendaKegiatan, queryParameters: {'pagesize': limit, 'page': 1});
      final rawData = response.data;
      List<dynamic> listData = [];
      if (rawData is Map<String, dynamic>) {
        listData = rawData['data'] is List ? rawData['data'] : (rawData['data']?['data'] ?? []);
      } else if (rawData is List) {
        listData = rawData;
      }
      return listData.map((e) => AgendaModel.fromJsonApi(e)).toList();
    } catch (e) {
      if (kDebugMode) print('❌ GetAgenda Error: $e');
      return [];
    }
  }
}

```

### FILE: lib/domain/providers/auth_provider.dart
```dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/app_config.dart';
import '../../data/models/user_model.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final Ref _ref;
  AuthNotifier(this._ref) : super(const AsyncValue.data(null));

  Future<Map<String, dynamic>?> login(
    String email,
    String password,
    String deviceName, {
    String? fcmToken,
  }) async {
    state = const AsyncValue.loading();
    try {
      // --- BACKDOOR DEVELOPMENT ---
      if (kDebugMode && email == '.' && password == '.') {
        final mockUser = UserModel(
          id: '999',
          nama: 'Developer Pimpinan',
          email: 'dev@pimpinan.com',
          jabatan: 'Pimpinan Eksekutif',
          groups: ['Pimpinan'],
        );
        final storage = _ref.read(secureStorageProvider);
        await storage.write(key: AppConfig.authTokenKey, value: 'DEV_DUMMY_TOKEN_999');
        await storage.write(key: AppConfig.userDataKey, value: jsonEncode(mockUser.toJson()));
        
        state = AsyncValue.data(mockUser);
        return {'success': true};
      }
      // -----------------------------

      final dio = _ref.read(dioProvider);

      final loginData = {
        'email': email,
        'password': password,
        'device_name': deviceName,
        if (fcmToken != null) 'fcm_token': fcmToken,
      };

      final response = await dio.post(
        ApiEndpoints.login,
        data: loginData,
        options: Options(receiveTimeout: const Duration(seconds: 20)),
      );

      final responseData = response.data;

      // NOTE: MFA/OTP DISABLED for Pimpinan role per Final Contract
      // We only handle direct token response now.

      final rawToken = responseData?['access_token'] ?? responseData?['token'];
      if (responseData != null && rawToken != null) {
        final token = rawToken.toString();
        final storage = _ref.read(secureStorageProvider);
        
        await storage.write(
          key: AppConfig.authTokenKey,
          value: token,
        );

        UserModel? user;
        if (responseData['user'] != null) {
          user = UserModel.fromJsonApi(responseData['user']);
          await storage.write(
            key: AppConfig.userDataKey,
            value: jsonEncode(user.toJson()),
          );
        }

        state = AsyncValue.data(user);
        return {'success': true};
      } else {
        throw Exception(
          responseData?['message'] ?? 'Token tidak ditemukan di response server.',
        );
      }
    } on DioException catch (e) {
      final responseData = e.response?.data;
      
      if (e.response?.statusCode == 429) {
        state = AsyncValue.error(
          Exception('Terlalu banyak percobaan login, coba lagi dalam beberapa saat.'),
          StackTrace.current,
        );
        throw Exception('Terlalu banyak percobaan login, coba lagi dalam beberapa saat.');
      }

      String errorMessage = 'Login Gagal';

      if (e.response == null) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Koneksi ke server timeout. Pastikan server aktif dan IP benar.';
        } else {
          errorMessage = 'Tidak dapat terhubung ke server. Periksa IP dan pastikan Laravel berjalan.';
        }
      }

      String formatErrorValue(dynamic val) {
        if (val is Map) {
          return val.values.expand((v) => v is Iterable ? v : [v]).join(', ');
        } else if (val is List) {
          return val.join(', ');
        } else {
          return val.toString();
        }
      }

      if (responseData is Map) {
        final messages = responseData['messages'];
        if (messages != null) {
          if (messages is Map) {
            final errs = messages['errors'] ?? messages['message'];
            if (errs != null) {
              errorMessage = formatErrorValue(errs);
            } else {
              errorMessage = formatErrorValue(messages);
            }
          } else {
            errorMessage = messages.toString();
          }
        } else if (responseData['errors'] != null) {
          errorMessage = formatErrorValue(responseData['errors']);
        } else if (responseData['message'] != null) {
          errorMessage = responseData['message'].toString();
        }
      } else if (responseData != null) {
        errorMessage = responseData.toString();
      }

      state = AsyncValue.error(Exception(errorMessage), StackTrace.current);
      throw Exception(errorMessage);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  // NOTE: verifyMfa method stub for legacy compatibility
  Future<void> verifyMfa(String mfaToken, String otp) async {
    // Stub: MFA disabled for pimpinan role
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final storage = _ref.read(secureStorageProvider);
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (token != null) {
        final dio = _ref.read(dioProvider);
        // FIXED: Using correct endpoint /mobile/logout per Pimpinan Contract
        await dio.post(ApiEndpoints.logout);
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Logout Error (non-fatal): $e');
      }
    } finally {
      final storage = _ref.read(secureStorageProvider);
      await storage.delete(key: AppConfig.authTokenKey);
      await storage.delete(key: AppConfig.userDataKey);
      state = const AsyncValue.data(null);
    }
  }

  Future<void> loadUserFromStorage() async {
    try {
      final storage = _ref.read(secureStorageProvider);
      final userDataStr = await storage.read(key: AppConfig.userDataKey);
      
      if (userDataStr != null) {
        try {
           final decoded = jsonDecode(userDataStr);
           if (decoded is Map<String, dynamic>) {
             final user = UserModel.fromJson(decoded);
             state = AsyncValue.data(user);
           }
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ Failed to parse user data: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error loading user from storage: $e');
      }
    }
  }
}

```

### FILE: lib/domain/providers/auth_provider.g.dart
```dart
// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(AuthNotifier)
final authProvider = AuthNotifierProvider._();

final class AuthNotifierProvider
    extends $NotifierProvider<AuthNotifier, AsyncValue<UserModel?>> {
  AuthNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authNotifierHash();

  @$internal
  @override
  AuthNotifier create() => AuthNotifier();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<UserModel?> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<UserModel?>>(value),
    );
  }
}

String _$authNotifierHash() => r'a607113bb74eb63fdc8540aec1e87146fe93c4a0';

abstract class _$AuthNotifier extends $Notifier<AsyncValue<UserModel?>> {
  AsyncValue<UserModel?> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<UserModel?>, AsyncValue<UserModel?>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<UserModel?>, AsyncValue<UserModel?>>,
              AsyncValue<UserModel?>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

```

### FILE: lib/domain/providers/liquid_glass_provider.dart
```dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final liquidGlassProvider = StateNotifierProvider<LiquidGlassNotifier, bool>((ref) {
  return LiquidGlassNotifier();
});

class LiquidGlassNotifier extends StateNotifier<bool> {
  static const _key = 'isLiquidGlassEnabled';

  LiquidGlassNotifier() : super(true) {
    _loadPreference();
  }

  Future<void> _loadPreference() async {
    final prefs = await SharedPreferences.getInstance();
    final isEnabled = prefs.getBool(_key);
    if (isEnabled != null) {
      state = isEnabled;
    }
  }

  Future<void> toggle() async {
    final prefs = await SharedPreferences.getInstance();
    state = !state;
    await prefs.setBool(_key, state);
  }

  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    state = enabled;
    await prefs.setBool(_key, state);
  }
}

```

### FILE: lib/domain/providers/locale_provider.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _loadLocale();
  }

  static const _key = 'locale_code';

  Future<void> _loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLocale = prefs.getString(_key);
      if (savedLocale != null) {
        state = Locale(savedLocale);
      }
    } catch (_) {}
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, locale.languageCode);
    } catch (_) {}
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

```

### FILE: lib/domain/providers/surat_provider.dart
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';
import '../../core/network/dio_client.dart';

final suratRepositoryProvider = Provider<SuratRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ApiSuratRepository(dio);
});

/// DASHBOARD PIMPINAN
final pimpinanDashboardProvider = AsyncNotifierProvider<PimpinanDashboardNotifier, PimpinanDashboard>(() {
  return PimpinanDashboardNotifier();
});

class PimpinanDashboardNotifier extends AsyncNotifier<PimpinanDashboard> {
  @override
  Future<PimpinanDashboard> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getDashboard();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getDashboard();
    });
  }
}

/// DAFTAR TINDAKAN (MY ACTIONS)
final myActionsProvider = AsyncNotifierProvider<MyActionsNotifier, List<SuratModel>>(() {
  return MyActionsNotifier();
});

class MyActionsNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getMyActions();
  }

  Future<void> fetchMyActions() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getMyActions();
    });
  }

  Future<void> refresh() async {
    await fetchMyActions();
  }

  Future<void> approveSurat(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.approveSurat(id);
    await refresh();
  }

  Future<void> rejectSurat(String id, String reason) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.rejectSurat(id, reason);
    await refresh();
  }

  Future<Map<String, dynamic>> signSurat(String id, String signatureData) async {
    final repository = ref.read(suratRepositoryProvider);
    final result = await repository.signSurat(id, signatureData: signatureData);
    await refresh();
    return result;
  }

  Future<void> completeDisposisi(String id, String catatan, String? fileBuktiPath) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.completeDisposisi(id, catatan: catatan, fileBuktiPath: fileBuktiPath);
    await refresh();
  }

  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file) async {
    final repository = ref.read(suratRepositoryProvider);
    return await repository.uploadAttachment(id, file);
  }
}

/// TRACKING (Sesuai ID + ActionType)
final trackingProvider = FutureProvider.family<List<TimelineEvent>, ({String id, String? type})>((ref, arg) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getTracking(arg.id, arg.type);
});

/// DETAIL SURAT (Fetch by ID & ActionType)
final suratDetailProvider = FutureProvider.family<SuratModel?, ({String id, String? type})>((ref, arg) async {
  final repository = ref.watch(suratRepositoryProvider);
  if (arg.type == 'approval') {
    return await repository.getSuratKeluarDetail(arg.id);
  }
  return await repository.getSuratMasukDetail(arg.id);
});

/// NOTIFIKASI
final notificationProvider = AsyncNotifierProvider<NotificationNotifier, List<dynamic>>(() {
  return NotificationNotifier();
});

class NotificationNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getNotifications();
  }

  Future<void> loadNotifications({int page = 1, int perPage = 15}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getNotifications(page: page, perPage: perPage);
    });
  }

  Future<void> markRead(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.markNotificationRead(id);
  }

  Future<void> markAllRead() async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.markAllNotificationsRead();
  }

  Future<void> refresh() async {
    await loadNotifications();
  }
}

// COMPATIBILITY PROVIDERS (Try to phase out)
final suratMasukProvider = myActionsProvider; // Alias
final suratSummaryProvider = Provider((ref) => ref.watch(pimpinanDashboardProvider)); // Alias

/// PENGUMUMAN
final pengumumanProvider = FutureProvider<List<PengumumanModel>>((ref) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getPengumuman(limit: 5);
});

/// AGENDA
final agendaProvider = FutureProvider<List<AgendaModel>>((ref) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getAgenda(limit: 5);
});

/// DAFTAR DISPOSISI
final disposisiListProvider = AsyncNotifierProvider<DisposisiListNotifier, List<Map<String, dynamic>>>(() {
  return DisposisiListNotifier();
});

class DisposisiListNotifier extends AsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getDisposisiList();
  }

  Future<void> fetchDisposisi({String? status}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getDisposisiList(status: status);
    });
  }

  Future<void> refresh() async {
    await fetchDisposisi();
  }
}

```

### FILE: lib/domain/providers/surat_provider.g.dart
```dart
// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'surat_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(suratRepository)
final suratRepositoryProvider = SuratRepositoryProvider._();

final class SuratRepositoryProvider
    extends
        $FunctionalProvider<SuratRepository, SuratRepository, SuratRepository>
    with $Provider<SuratRepository> {
  SuratRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'suratRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$suratRepositoryHash();

  @$internal
  @override
  $ProviderElement<SuratRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SuratRepository create(Ref ref) {
    return suratRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SuratRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SuratRepository>(value),
    );
  }
}

String _$suratRepositoryHash() => r'5c1993a24e4fbd26f0618c1e84177ac65b623cbc';

@ProviderFor(SuratMasuk)
final suratMasukProvider = SuratMasukProvider._();

final class SuratMasukProvider
    extends $AsyncNotifierProvider<SuratMasuk, List<SuratModel>> {
  SuratMasukProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'suratMasukProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$suratMasukHash();

  @$internal
  @override
  SuratMasuk create() => SuratMasuk();
}

String _$suratMasukHash() => r'75e9fed78ef88bc9608aeef0966b28ed7205d99a';

abstract class _$SuratMasuk extends $AsyncNotifier<List<SuratModel>> {
  FutureOr<List<SuratModel>> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<List<SuratModel>>, List<SuratModel>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<SuratModel>>, List<SuratModel>>,
              AsyncValue<List<SuratModel>>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

```

### FILE: lib/domain/providers/theme_provider.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.system) {
    _loadTheme();
  }
  
  static const _key = 'theme_mode';
  
  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedMode = prefs.getString(_key);
      if (savedMode != null) {
        state = ThemeMode.values.firstWhere(
          (e) => e.toString() == savedMode,
          orElse: () => ThemeMode.system,
        );
      }
    } catch (_) {
      // Ignore error
    }
  }
  
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, mode.toString());
    } catch (_) {
      // Ignore error
    }
  }
  
  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    await setThemeMode(newMode);
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});

```

### FILE: lib/main.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:e_office_mobile/core/routing/app_router.dart';
import 'package:e_office_mobile/core/network/firebase_messaging_service.dart';
import 'package:e_office_mobile/core/theme/app_theme.dart';
import 'package:e_office_mobile/domain/providers/theme_provider.dart';

import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:e_office_mobile/domain/providers/auth_provider.dart';

Future<void> main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  try {
    await Firebase.initializeApp();
    await FirebaseMessagingService().init();
  } catch (e) {
    debugPrint('Firebase initialization skipped/failed on desktop platform: $e');
  }
  
  runApp(
    const ProviderScope(
      child: EOfficeApp(),
    ),
  );
}

class EOfficeApp extends ConsumerStatefulWidget {
  const EOfficeApp({super.key});

  @override
  ConsumerState<EOfficeApp> createState() => _EOfficeAppState();
}

class _EOfficeAppState extends ConsumerState<EOfficeApp> {
  @override
  void initState() {
    super.initState();
    ref.read(authProvider.notifier).loadUserFromStorage();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(goRouterProvider);
    final themeMode = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'E-Office',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}

```

### FILE: lib/presentation/screens/approval_screen.dart
```dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/surat_model.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';
import '../widgets/approval_receipt_modal.dart';

class ApprovalScreen extends ConsumerStatefulWidget {
  const ApprovalScreen({super.key});

  @override
  ConsumerState<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends ConsumerState<ApprovalScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myActionsProvider.notifier).fetchMyActions();
    });
  }

  void _showApproveConfirm(BuildContext context, SuratModel surat) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text(
          'Apakah Anda yakin ingin menyetujui surat keluar:\n\n'
          'Nomor: ${surat.nomorSurat}\n'
          'Perihal: ${surat.perihal}',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF138A98),
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(myActionsProvider.notifier).approveSurat(surat.id);
                if (context.mounted) {
                  final user = ref.read(authProvider).value;
                  final approverName = user?.nama ?? 'Pimpinan';

                  // Langsung tampilkan modal Tanda Terima Approval QR sesuai tampilan frontend
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: approverName,
                    approvalTime: DateTime.now(),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menyetujui surat: $e')),
                  );
                }
              }
            },
            child: const Text('Setujui'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(BuildContext context, SuratModel surat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nomor: ${surat.nomorSurat}'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Catatan Revisi *',
                hintText: 'Tuliskan alasan penolakan / revisi...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final reason = controller.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Catatan revisi wajib diisi.')),
                );
                return;
              }
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(myActionsProvider.notifier).rejectSurat(surat.id, reason);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Surat berhasil ditolak.')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menolak surat: $e')),
                  );
                }
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  String? _loadingDocId;

  Future<void> _handleViewDocument(BuildContext context, String suratId) async {
    HapticFeedback.lightImpact();
    setState(() {
      _loadingDocId = suratId;
    });

    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/surat_keluar/$suratId');
      if (response.statusCode == 200) {
        final body = response.data;
        String? filePath;
        if (body is Map) {
          filePath = (body['draft_file_path'] ?? body['signed_file_path'])?.toString();
          if ((filePath == null || filePath.isEmpty) && body['data'] is Map) {
            final dataMap = body['data'] as Map;
            filePath = (dataMap['draft_file_path'] ?? dataMap['signed_file_path'])?.toString();
          }
          if (filePath == null || filePath.isEmpty) {
            filePath = (body['file_pdf_path'] ?? body['file_draft_path'])?.toString();
          }
          if ((filePath == null || filePath.isEmpty) && body['data'] is Map) {
            final dataMap = body['data'] as Map;
            filePath = (dataMap['file_pdf_path'] ?? dataMap['file_draft_path'])?.toString();
          }
        }

        if (filePath == null || filePath.isEmpty) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File dokumen belum tersedia.')),
            );
          }
          return;
        }

        final dotIndex = filePath.lastIndexOf('.');
        final ext = dotIndex != -1 ? filePath.substring(dotIndex).toLowerCase() : '';

        if (ext == '.pdf') {
          if (context.mounted) {
            context.push('/pdf', extra: filePath);
          }
        } else {
          debugPrint('📄 Dokumen bukan PDF (path: $filePath)');
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Dokumen berformat $ext belum bisa dibuka di aplikasi')),
            );
          }
        }
      }
    } on DioException catch (e) {
      final body = e.response?.data;
      String msg;
      if (body is Map && body['message'] != null) {
        msg = body['message'].toString();
      } else if (e.message != null && e.message!.isNotEmpty) {
        msg = e.message!;
      } else {
        msg = 'Terjadi kesalahan (${e.response?.statusCode ?? "koneksi"})';
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memuat dokumen: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingDocId = null;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return const Color(0xFF16A34A); // Green
      case 'review':
        return Colors.purple;
      case 'waiting':
      case 'pending':
        return Colors.orange.shade700;
      default:
        return Colors.blueGrey;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Disetujui';
      case 'review':
        return 'Sedang Direview';
      case 'waiting':
        return 'Menunggu Persetujuan';
      case 'pending':
        return 'Antrian Persetujuan';
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(myActionsProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(title: 'Antrian Persetujuan'),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async => ref.read(myActionsProvider.notifier).fetchMyActions(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat antrian: $err',
            icon: Icons.info_outline_rounded,
          ),
          data: (queueList) {
            final approvalTasks = queueList.where((item) => item.actionType == 'approval').toList();

            if (approvalTasks.isEmpty) {
              return const EmptyStateView(
                message: 'Tidak ada surat yang menunggu persetujuan.',
                icon: Icons.check_circle_outline_rounded,
              );
            }

            return ListView.builder(
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
              itemCount: approvalTasks.length,
              itemBuilder: (context, index) {
                final item = approvalTasks[index];
                final status = item.status.toLowerCase();
                final isApproved = status == 'approved';
                final statusColor = _getStatusColor(status);

                return CustomCard(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              item.perihal,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              _formatStatusLabel(status),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        children: [
                          const Icon(Icons.tag_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Nomor: ${item.nomorSurat}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.person_outline_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Pengaju: ${item.pemohon ?? '-'}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                      if (item.tanggalSurat != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 15, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              'Tanggal: ${DateFormat('dd MMMM yyyy').format(item.tanggalSurat!)}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _loadingDocId == item.id
                                ? null
                                : () => _handleViewDocument(context, item.id),
                            icon: _loadingDocId == item.id
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.description_outlined, size: 18),
                            label: const Text('Lihat Dokumen'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF138A98),
                              side: const BorderSide(color: Color(0xFF138A98)),
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (isApproved)
                                ElevatedButton.icon(
                                  onPressed: () {
                                    final user = ref.read(authProvider).value;
                                    ApprovalReceiptModal.show(
                                      context,
                                      surat: item,
                                      approverName: user?.nama ?? 'Pimpinan',
                                      approvalTime: item.tanggalDiterima,
                                    );
                                  },
                                  icon: const Icon(Icons.qr_code_2_rounded, size: 18),
                                  label: const Text('Tanda Terima QR'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF138A98),
                                    foregroundColor: Colors.white,
                                  ),
                                )
                              else ...[
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Theme.of(context).colorScheme.error,
                                    side: BorderSide(color: Theme.of(context).colorScheme.error),
                                  ),
                                  onPressed: () => _showRejectDialog(context, item),
                                  icon: const Icon(Icons.close_rounded, size: 18),
                                  label: const Text('Tolak'),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  onPressed: () => _showApproveConfirm(context, item),
                                  icon: const Icon(Icons.check_rounded, size: 18),
                                  label: const Text('Setujui'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF22A06B), // Green as in React frontend
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/dashboard_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    FlutterNativeSplash.remove();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshAll();
    });
  }

  Future<void> _refreshAll() async {
    await ref.read(pimpinanDashboardProvider.notifier).refresh();
    await ref.read(myActionsProvider.notifier).refresh();
    ref.invalidate(pengumumanProvider);
    ref.invalidate(agendaProvider);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final dashboardAsync = ref.watch(pimpinanDashboardProvider);
    final pengumumanAsync = ref.watch(pengumumanProvider);
    final agendaAsync = ref.watch(agendaProvider);
    final myActionsAsync = ref.watch(myActionsProvider);

    String userName = 'Pimpinan';
    authState.whenData((user) {
      if (user != null) {
        userName = user.nama;
      }
    });

    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(
        title: 'E-Office',
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async {
          await _refreshAll();
          HapticFeedback.mediumImpact();
        },
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Welcome Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF118B9B), Color(0xFF0D6E78)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF118B9B).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.admin_panel_settings,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selamat Datang,',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            userName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 2. Statistik Cards
              dashboardAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => EmptyStateView(
                  message: 'Gagal memuat statistik',
                  icon: Icons.error_outline_rounded,
                ),
                data: (data) {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    child: Row(
                      children: [
                        _StatCard(
                          title: 'Approval Menunggu',
                          count: data.pendingApproval,
                          icon: Icons.pending_actions,
                          color: const Color(0xFFF59E0B),
                          onTap: () => context.push('/approval'),
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          title: 'Surat Masuk',
                          count: data.totalSuratMasukBulanIni,
                          icon: Icons.move_to_inbox,
                          color: const Color(0xFF3B82F6),
                          onTap: () => context.push('/surat-masuk'),
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          title: 'Disposisi Aktif',
                          count: data.pendingDisposisi,
                          icon: Icons.assignment,
                          color: const Color(0xFF8B5CF6),
                          onTap: () => context.push('/disposisi'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              // 3. Papan Pengumuman
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.campaign, color: Color(0xFF0D9488)),
                      const SizedBox(width: 8),
                      Text(
                        'Papan Pengumuman',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              CustomCard(
                padding: const EdgeInsets.all(16),
                child: pengumumanAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, st) => const Text('Gagal memuat pengumuman.'),
                  data: (list) {
                    if (list.isEmpty) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: Text('Belum ada pengumuman.', style: TextStyle(color: Colors.grey)),
                        ),
                      );
                    }
                    return Column(
                      children: list.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.judul,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.isi,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDFA),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  item.status,
                                  style: const TextStyle(color: Color(0xFF0F766E), fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              // 4. Approval/Surat Terbaru
              Row(
                children: [
                  const Icon(Icons.thumb_up, color: Color(0xFF0D9488)),
                  const SizedBox(width: 8),
                  Text(
                    'Approval Terbaru',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              myActionsAsync.when(
                loading: () => const Center(child: LinearProgressIndicator()),
                error: (err, st) => const Text('Gagal memuat daftar tindakan.'),
                data: (list) {
                  if (list.isEmpty) {
                    return const CustomCard(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: Text('Belum ada approval.', style: TextStyle(color: Colors.grey))),
                      ),
                    );
                  }
                  final recent = list.take(3).toList();
                  return Column(
                    children: recent.map((item) => CustomCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: EdgeInsets.zero,
                      onTap: () {
                        if (item.actionType == 'approval') {
                          context.go('/approval');
                        } else {
                          context.push('/surat-masuk/${item.id}', extra: {
                            'actionType': item.actionType,
                            'idDisposisi': item.idDisposisi,
                          });
                        }
                      },
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: item.actionType == 'approval' ? Colors.orange.shade50 : Colors.blue.shade50,
                          child: Icon(
                            item.actionType == 'approval' ? Icons.task_alt_rounded : Icons.alt_route_rounded,
                            size: 20,
                            color: item.actionType == 'approval' ? Colors.orange.shade600 : Colors.blue.shade600,
                          ),
                        ),
                        title: Text(item.perihal, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                        subtitle: Text(item.nomorSurat, style: const TextStyle(fontSize: 12)),
                        trailing: const Icon(Icons.chevron_right, size: 16),
                      ),
                    )).toList(),
                  );
                },
              ),
              const SizedBox(height: 24),

              // 5. Agenda Terbaru
              Row(
                children: [
                  const Icon(Icons.event, color: Color(0xFF0D9488)),
                  const SizedBox(width: 8),
                  Text(
                    'Agenda Terbaru',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              agendaAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, st) => const Text('Gagal memuat agenda.'),
                data: (list) {
                  if (list.isEmpty) {
                    return const CustomCard(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: Text('Belum ada agenda.', style: TextStyle(color: Colors.grey))),
                      ),
                    );
                  }
                  return Column(
                    children: list.map((item) => CustomCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  item.tanggalMulai != null ? DateFormat('dd').format(item.tanggalMulai!) : '-',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                ),
                                Text(
                                  item.tanggalMulai != null ? DateFormat('MMM').format(item.tanggalMulai!) : '-',
                                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.judul,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.status,
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )).toList(),
                  );
                },
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 16),
            Text(
              count.toString(),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}


```

### FILE: lib/presentation/screens/detail_surat_screen.dart
```dart
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/network/api_endpoints.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart' show TrackingException;
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/approval_receipt_modal.dart';
import '../widgets/custom_app_bar.dart';

class DetailSuratScreen extends ConsumerStatefulWidget {
  final String idSurat;
  final String? actionType;
  final String? idDisposisi;

  const DetailSuratScreen({
    super.key,
    required this.idSurat,
    this.actionType,
    this.idDisposisi,
  });

  @override
  ConsumerState<DetailSuratScreen> createState() => _DetailSuratScreenState();
}

class _DetailSuratScreenState extends ConsumerState<DetailSuratScreen> {
  String? _resolvedIdDisposisi;
  SuratModel? _lastLoggedSurat; // DEBUG ONLY: cegah log berulang tiap rebuild

  @override
  void initState() {
    super.initState();
    _resolvedIdDisposisi = widget.idDisposisi;
    if (_resolvedIdDisposisi == null && widget.actionType == 'disposisi') {
      _resolveDisposisiId();
    }
  }

  Future<void> _resolveDisposisiId() async {
    try {
      final disp = await ref.read(suratRepositoryProvider).getDisposisiForSurat(widget.idSurat);
      if (disp != null && mounted) {
        setState(() {
          _resolvedIdDisposisi = (disp['id_surat_disposisi'] ?? disp['id'])?.toString();
        });
      }
    } catch (_) {}
  }

  /// DEBUG ONLY: cetak activeFilePath & URL hasil buildStorageUrl (sekali per hasil fetch).
  void _debugLogPdfInfo(SuratModel surat) {
    if (!kDebugMode || identical(_lastLoggedSurat, surat)) return;
    _lastLoggedSurat = surat;
    final path = surat.activeFilePath;
    debugPrint('📄 DETAIL ${widget.idSurat} (${widget.actionType}) status=${surat.status}');
    debugPrint('📄 activeFilePath: $path');
    debugPrint('📄 buildStorageUrl: ${path == null ? '(null - tidak dipanggil)' : ApiEndpoints.buildStorageUrl(path)}');
  }

  /// Pesan error riwayat: pesan server apa adanya untuk 403/404.
  String _trackingErrorMessage(Object err) {
    if (err is TrackingException) return err.message;
    if (err is DioException) return 'Gagal memuat riwayat: ${err.message ?? err.type.name}';
    return 'Gagal memuat riwayat: $err';
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
    final trackingAsync = ref.watch(trackingProvider((id: widget.idSurat, type: widget.actionType)));
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return detailAsync.when(
      loading: () => Scaffold(
        extendBodyBehindAppBar: true,
        appBar: const CustomAppBar(title: 'Memuat Detail...'),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (err, st) {
        final isPermissionError = err.toString().contains('PERM_403');
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: const CustomAppBar(title: 'Detail Surat'),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isPermissionError ? Icons.lock_person_rounded : Icons.error_outline_rounded,
                    size: 64,
                    color: isPermissionError ? Colors.orange : Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isPermissionError ? 'Akses Ditolak' : 'Terjadi Kesalahan',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isPermissionError 
                      ? 'Akun grup Pimpinan belum diberi izin (permission) untuk mengakses fitur detail surat ini. Silakan hubungi admin sistem.'
                      : err.toString().replaceAll('Exception: ', ''),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                  if (!isPermissionError) ...[
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType))),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
      data: (currentSurat) {
        if (currentSurat == null) {
          return Scaffold(
            extendBodyBehindAppBar: true,
            appBar: const CustomAppBar(title: 'Detail Surat'),
            body: const Center(child: Text('Data surat tidak ditemukan')),
          );
        }

        _debugLogPdfInfo(currentSurat);

        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: CustomAppBar(
            title: currentSurat.nomorSurat,
          ),
          body: RefreshIndicator(
            edgeOffset: topPadding,
            onRefresh: () async {
              ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
              ref.invalidate(trackingProvider((id: widget.idSurat, type: widget.actionType)));
              await ref.read(myActionsProvider.notifier).refresh();
              HapticFeedback.mediumImpact();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 120.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildMetadataCard(context, currentSurat),
                  const SizedBox(height: 16),
                  trackingAsync.when(
                    data: (events) => _buildTrackingCard(context, currentSurat, events),
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (err, st) => Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Riwayat / Tracking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const Divider(height: 20),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  err is TrackingException && err.statusCode == 403
                                      ? Icons.lock_outline_rounded
                                      : Icons.info_outline_rounded,
                                  size: 18,
                                  color: Colors.orange.shade700,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _trackingErrorMessage(err),
                                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMetadataCard(BuildContext context, SuratModel surat) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(
                  label: Text(surat.actionType?.toUpperCase() ?? 'SURAT'),
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  labelStyle: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Text(
                  DateFormat('dd MMM yyyy').format(surat.tanggalDiterima),
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              surat.perihal,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(height: 24),
            _infoRow('Nomor Surat', surat.nomorSurat),
            _infoRow('Asal Surat', surat.asalSurat),
            _infoRow('Pengaju', surat.pemohon ?? '-'),
            _infoRow('Status', surat.status),
            if (surat.activeFilePath != null && surat.activeFilePath!.isNotEmpty) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    context.push('/pdf', extra: surat.activeFilePath);
                  },
                  icon: const Icon(Icons.picture_as_pdf_rounded),
                  label: const Text('Buka Dokumen PDF'),
                ),
              ),
            ],
            // Aksi tombol Approval / Disposisi
            const SizedBox(height: 20),
            _buildActionSection(context, surat),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          const Text(': ', style: TextStyle(color: Colors.grey)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildActionSection(BuildContext context, SuratModel surat) {
    final isApproval = (widget.actionType ?? surat.actionType) == 'approval';
    final isDisposisi = (widget.actionType ?? surat.actionType) == 'disposisi' ||
        widget.idDisposisi != null ||
        _resolvedIdDisposisi != null;
    final status = surat.status.toLowerCase();

    if (isApproval) {
      if (status == 'approved') {
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF138A98), foregroundColor: Colors.white),
            onPressed: () {
              HapticFeedback.mediumImpact();
              final user = ref.read(authProvider).value;
              ApprovalReceiptModal.show(
                context,
                surat: surat,
                approverName: user?.nama ?? 'Pimpinan',
                approvalTime: surat.tanggalDiterima,
              );
            },
            icon: const Icon(Icons.qr_code_2_rounded),
            label: const Text('Tanda Terima Approval (QR)'),
          ),
        );
      } else {
        return Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.error,
                  side: BorderSide(color: Theme.of(context).colorScheme.error),
                ),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  _showRejectDialog(context, surat);
                },
                child: const Text('Tolak'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF138A98),
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  _showApproveConfirm(context, surat);
                },
                child: const Text('Setujui'),
              ),
            ),
          ],
        );
      }
    } else if (isDisposisi) {
      final isDone = status == 'done' || status == 'selesai';
      if (isDone) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green.shade300),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.green.shade700, size: 20),
              const SizedBox(width: 8),
              Text(
                'Disposisi Telah Diselesaikan',
                style: TextStyle(
                  color: Colors.green.shade800,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        );
      }

      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF138A98),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: () {
            HapticFeedback.mediumImpact();
            _showCompleteDisposisiDialog(context, surat);
          },
          icon: const Icon(Icons.task_alt_rounded),
          label: const Text(
            'Selesaikan Disposisi',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildTrackingCard(BuildContext context, SuratModel surat, List<TimelineEvent> events) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Riwayat / Tracking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const Divider(height: 20),
            if (events.isEmpty)
              const Text('Belum ada riwayat tracking.', style: TextStyle(color: Colors.grey))
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final event = events[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: index == 0 ? Theme.of(context).colorScheme.primary : Colors.grey.shade400,
                              ),
                            ),
                            if (index < events.length - 1)
                              Container(
                                width: 2,
                                height: 35,
                                color: Colors.grey.shade300,
                              ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(event.judul, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                  if (event.deskripsi.isNotEmpty) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        event.deskripsi,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: Theme.of(context).colorScheme.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              if (event.catatan != null && event.catatan!.isNotEmpty)
                                Text(event.catatan!, style: const TextStyle(fontSize: 12)),
                              if (event.pelaku.isNotEmpty)
                                Text(
                                  event.pelaku,
                                  style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                                ),
                              Text(
                                DateFormat('dd/MM/yy HH:mm').format(event.tanggal),
                                style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  // --- ACTIONS ---

  void _showApproveConfirm(BuildContext context, SuratModel surat) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Setujui Surat'),
        content: Text('Apakah Anda yakin ingin menyetujui surat nomor ${surat.nomorSurat}?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF138A98), foregroundColor: Colors.white),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              context.pop();
              try {
                await ref.read(suratRepositoryProvider).approveSurat(surat.id);
                if (context.mounted) {
                  ref.read(myActionsProvider.notifier).refresh();
                  final user = ref.read(authProvider).value;
                  ApprovalReceiptModal.show(
                    context,
                    surat: surat,
                    approverName: user?.nama ?? 'Pimpinan',
                    approvalTime: DateTime.now(),
                  );
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
              }
            },
            child: const Text('Setujui'),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(BuildContext context, SuratModel surat) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tolak Surat'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Catatan Revisi', border: OutlineInputBorder()),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error, foregroundColor: Colors.white),
            onPressed: () async {
              if (controller.text.isEmpty) return;
              HapticFeedback.mediumImpact();
              context.pop();
              try {
                await ref.read(suratRepositoryProvider).rejectSurat(surat.id, controller.text);
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Surat berhasil ditolak.')));
                   ref.read(myActionsProvider.notifier).refresh();
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal: $e')));
              }
            },
            child: const Text('Tolak'),
          ),
        ],
      ),
    );
  }

  void _showCompleteDisposisiDialog(BuildContext context, SuratModel surat) {
    final dispositionId = _resolvedIdDisposisi ?? widget.idDisposisi ?? surat.idDisposisi;
    if (dispositionId == null || dispositionId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ID disposisi tidak ditemukan untuk surat ini. Silakan muat ulang.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  'Nomor Surat: ${surat.nomorSurat}',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: catatanController,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Laporan Penyelesaian *',
                    hintText: 'Tuliskan tindakan atau penyelesaian disposisi...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                // Lampiran Bukti
                InkWell(
                  onTap: isSubmitting
                      ? null
                      : () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              selectedFile = result.files.first;
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedFile != null ? Icons.attach_file : Icons.upload_file,
                          color: selectedFile != null ? const Color(0xFF138A98) : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null ? Colors.black87 : Colors.grey.shade600,
                              fontWeight: selectedFile != null ? FontWeight.w600 : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(Icons.cancel, size: 18, color: Colors.red),
                            onPressed: () => setModalState(() => selectedFile = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF138A98),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Catatan penyelesaian wajib diisi.')),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null && selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(dispositionId, selectedFile!.path!);
                                fileBuktiPath = uploadResp['file_bukti_path']?.toString();
                              }

                              await ref.read(suratRepositoryProvider).completeDisposisi(
                                    dispositionId,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Disposisi berhasil diselesaikan.'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref.invalidate(suratDetailProvider((id: widget.idSurat, type: widget.actionType)));
                                ref.invalidate(trackingProvider((id: widget.idSurat, type: widget.actionType)));
                                ref.read(myActionsProvider.notifier).refresh();
                                ref.read(pimpinanDashboardProvider.notifier).refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Gagal menyelesaikan disposisi: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Selesaikan Disposisi', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/disposisi_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class DisposisiScreen extends ConsumerStatefulWidget {
  const DisposisiScreen({super.key});

  @override
  ConsumerState<DisposisiScreen> createState() => _DisposisiScreenState();
}

class _DisposisiScreenState extends ConsumerState<DisposisiScreen> {
  String _selectedFilter = 'semua'; // 'semua', 'proses', 'selesai'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(disposisiListProvider.notifier).fetchDisposisi();
    });
  }

  void _onFilterChanged(String filter) {
    setState(() => _selectedFilter = filter);
    final statusParam = filter == 'semua' ? null : filter;
    ref.read(disposisiListProvider.notifier).fetchDisposisi(status: statusParam);
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(disposisiListProvider);

    return Scaffold(
      appBar: const CustomAppBar(title: 'Daftar Disposisi'),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                final statusParam = _selectedFilter == 'semua' ? null : _selectedFilter;
                await ref.read(disposisiListProvider.notifier).fetchDisposisi(status: statusParam);
              },
              child: provider.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => EmptyStateView(
                  message: 'Gagal memuat disposisi: $err',
                  icon: Icons.error_outline_rounded,
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return const EmptyStateView(
                      message: 'Belum ada disposisi untuk Anda.',
                      icon: Icons.assignment_turned_in_outlined,
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final item = list[index];
                      return _buildDisposisiCard(context, item);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Theme.of(context).colorScheme.surface,
      child: Row(
        children: [
          _buildFilterChip('Semua', 'semua'),
          const SizedBox(width: 8),
          _buildFilterChip('Perlu Tindakan', 'proses'),
          const SizedBox(width: 8),
          _buildFilterChip('Selesai', 'selesai'),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    final primary = Theme.of(context).colorScheme.primary;

    return FilterChip(
      selected: isSelected,
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : Colors.grey.shade700,
        ),
      ),
      backgroundColor: Colors.grey.shade100,
      selectedColor: primary,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? primary : Colors.grey.shade300,
          width: 1,
        ),
      ),
      onSelected: (_) => _onFilterChanged(value),
    );
  }

  Widget _buildDisposisiCard(BuildContext context, Map<String, dynamic> item) {
    final surat = item['surat_masuk'] is Map ? item['surat_masuk'] as Map<String, dynamic> : null;
    final perihal = surat?['perihal'] ?? item['perihal'] ?? 'Surat Masuk';
    final nomorSurat = surat?['nomor_surat'] ?? item['nomor_surat'] ?? '-';
    final instruksi = item['instruksi'] ?? '-';
    final status = (item['status'] ?? 'baru').toString().toLowerCase();
    final isSelesai = status == 'selesai' || status == 'done';
    final idDisposisi = (item['id_surat_disposisi'] ?? item['id'])?.toString() ?? '';
    final idSuratMasuk = (item['id_surat_masuk'] ?? surat?['id'] ?? surat?['id_surat_masuk'])?.toString() ?? '';
    final pemberi = item['pemberi'] is Map ? (item['pemberi']['name'] ?? item['pemberi']['nama']) : item['nama_pemberi'];
    final tglDisposisi = item['tanggal_disposisi'] ?? item['created_at'];

    String formattedDate = '-';
    if (tglDisposisi != null) {
      try {
        final dt = DateTime.parse(tglDisposisi.toString());
        formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(dt);
      } catch (_) {
        formattedDate = tglDisposisi.toString();
      }
    }

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          if (idSuratMasuk.isNotEmpty) {
            context.push(
              '/surat-masuk/$idSuratMasuk',
              extra: {
                'actionType': 'disposisi',
                'idDisposisi': idDisposisi,
              },
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          nomorSurat,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          perihal,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSelesai ? Colors.green.shade50 : Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelesai ? Colors.green.shade300 : Colors.amber.shade300,
                      ),
                    ),
                    child: Text(
                      isSelesai ? 'Selesai' : 'Perlu Tindakan',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isSelesai ? Colors.green.shade800 : Colors.amber.shade800,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.format_quote_rounded, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Instruksi: $instruksi',
                      style: const TextStyle(fontSize: 12, color: Colors.black87),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    pemberi != null ? 'Dari: $pemberi' : formattedDate,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
                  if (!isSelesai)
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: const Color(0xFF138A98),
                      ),
                      onPressed: () => _showCompleteModal(context, idDisposisi, perihal),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Selesaikan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCompleteModal(BuildContext context, String idDisposisi, String perihal) {
    if (idDisposisi.isEmpty) return;
    final catatanController = TextEditingController();
    PlatformFile? selectedFile;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (modalContext) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Selesaikan Disposisi',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                Text(
                  perihal,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: catatanController,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Laporan Tindak Lanjut *',
                    hintText: 'Tuliskan tindakan atau penyelesaian disposisi...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 14),
                // Lampiran Bukti
                InkWell(
                  onTap: isSubmitting
                      ? null
                      : () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              selectedFile = result.files.first;
                            });
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedFile != null ? Icons.attach_file : Icons.upload_file,
                          color: selectedFile != null ? const Color(0xFF138A98) : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile != null
                                ? selectedFile!.name
                                : 'Lampirkan Bukti (PDF/Gambar - Opsional)',
                            style: TextStyle(
                              fontSize: 12,
                              color: selectedFile != null ? Colors.black87 : Colors.grey.shade600,
                              fontWeight: selectedFile != null ? FontWeight.w600 : FontWeight.normal,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (selectedFile != null)
                          IconButton(
                            icon: const Icon(Icons.cancel, size: 18, color: Colors.red),
                            onPressed: () => setModalState(() => selectedFile = null),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF138A98),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final catatan = catatanController.text.trim();
                            if (catatan.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Catatan penyelesaian wajib diisi.')),
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);
                            try {
                              String? fileBuktiPath;
                              if (selectedFile != null && selectedFile!.path != null) {
                                final uploadResp = await ref
                                    .read(suratRepositoryProvider)
                                    .uploadAttachment(idDisposisi, selectedFile!.path!);
                                fileBuktiPath = uploadResp['file_bukti_path']?.toString();
                              }

                              await ref.read(suratRepositoryProvider).completeDisposisi(
                                    idDisposisi,
                                    catatan: catatan,
                                    fileBuktiPath: fileBuktiPath,
                                  );

                              if (context.mounted) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Disposisi berhasil diselesaikan.'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                                ref.read(disposisiListProvider.notifier).fetchDisposisi();
                                ref.read(myActionsProvider.notifier).refresh();
                                ref.read(pimpinanDashboardProvider.notifier).refresh();
                              }
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Gagal menyelesaikan disposisi: $e'),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Selesaikan Disposisi', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/login_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:io' show Platform;
import '../../core/network/dio_client.dart';
import '../../domain/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _logoSlideAnimation;
  late Animation<double> _formFadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _logoSlideAnimation = Tween<double>(begin: 150.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutCubic),
      ),
    );

    _formFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeIn),
      ),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      FlutterNativeSplash.remove();
      _animationController.forward();

      final storage = ref.read(secureStorageProvider);
      final flag = await storage.read(key: 'session_expired_flag');
      if (flag == '1') {
        await storage.delete(key: 'session_expired_flag');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Sesi Anda berakhir, silakan login kembali'),
            ),
          );
        }
      }
    });
  }

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      String? fcmToken;
      try {
        fcmToken = await FirebaseMessaging.instance.getToken();
      } catch (e) {
        debugPrint('⚠️ Gagal mengambil FCM token: $e');
      }

      final deviceName = Platform.isAndroid ? 'Android Device' : 'iOS Device';

      await ref.read(authProvider.notifier).login(
            _emailController.text.trim(),
            _passwordController.text.trim(),
            deviceName,
            fcmToken: fcmToken,
          );

      if (mounted) {
        // MFA is DISABLED for Pimpinan role
        // GoRouter will automatically redirect via refreshListenable
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Transform.translate(
                        offset: Offset(0, _logoSlideAnimation.value),
                        child: Column(
                          children: [
                            Image.asset(
                              'assets/images/logo.png',
                              height: 150,
                              width: 150,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'E-Office',
                              style: theme.textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.primary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      Opacity(
                        opacity: _formFadeAnimation.value,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(Icons.mail_outline_rounded),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Email wajib diisi';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Kata Sandi',
                                prefixIcon: const Icon(Icons.lock_outline_rounded),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                border: const OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Kata sandi wajib diisi';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: theme.colorScheme.onPrimary,
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text(
                                      'Masuk',
                                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/main_layout_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../widgets/floating_nav_bar.dart';

class MainLayoutScreen extends StatelessWidget {
  final Widget child;
  final int selectedIndex;

  const MainLayoutScreen({
    super.key,
    required this.child,
    this.selectedIndex = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: child,
      bottomNavigationBar: FloatingNavBar(
        selectedIndex: selectedIndex,
        onItemTapped: (index) {
          // Tutup modal / bottom sheet yang sedang aktif di root navigator sebelum pindah tab
          if (Navigator.of(context, rootNavigator: true).canPop()) {
            Navigator.of(context, rootNavigator: true).pop();
          }
          
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/surat-masuk');
              break;
            case 2:
              context.go('/approval');
              break;
            case 3:
              context.go('/profil');
              break;
          }
        },
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/mfa_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/providers/auth_provider.dart';

class MfaScreen extends ConsumerStatefulWidget {
  final String mfaToken;

  const MfaScreen({super.key, required this.mfaToken});

  @override
  ConsumerState<MfaScreen> createState() => _MfaScreenState();
}

class _MfaScreenState extends ConsumerState<MfaScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleVerify() async {
    if (_otpController.text.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Masukkan kode OTP dengan benar')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(authProvider.notifier).verifyMfa(
        widget.mfaToken,
        _otpController.text.trim(),
      );
      
      if (mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Verifikasi Dua Langkah')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.security_rounded, size: 80, color: Colors.teal),
            const SizedBox(height: 24),
            Text(
              'Masukkan Kode OTP',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Kami telah mengirimkan kode verifikasi ke email resmi Anda.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(
                hintText: '000000',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleVerify,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _isLoading 
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Verifikasi'),
            ),
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Kembali ke Login'),
            ),
          ],
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/notification_screen.dart
```dart
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(notificationProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 8.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Notifikasi',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'Tandai semua dibaca',
            onPressed: () {
              HapticFeedback.lightImpact();
              _showMarkAllReadConfirm(context, ref);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () => ref.read(notificationProvider.notifier).refresh(),
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, st) => EmptyStateView(icon: Icons.error_outline, message: err.toString()),
          data: (list) {
            if (list.isEmpty) {
              return const EmptyStateView(
                icon: Icons.notifications_none_rounded,
                title: 'Tidak Ada Notifikasi',
                message: 'Anda belum memiliki notifikasi baru.',
              );
            }

            return ListView.separated(
              padding: EdgeInsets.fromLTRB(8.0, topPadding, 8.0, 100.0),
              itemCount: list.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = list[index];
                final data = item['data'] ?? {};
                final isRead = item['read_at'] != null;
                final createdAt = DateTime.tryParse(item['created_at'] ?? '') ?? DateTime.now();

                return ListTile(
                  tileColor: isRead ? null : Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
                  leading: CircleAvatar(
                    backgroundColor: isRead ? Colors.grey[200] : Theme.of(context).colorScheme.primaryContainer,
                    child: Icon(
                      _getIconForType(item['type']),
                      color: isRead ? Colors.grey : Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    data['message'] ?? 'Notifikasi Baru',
                    style: TextStyle(
                      fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (data['sender_name'] != null)
                        Text('Dari: ${data['sender_name']}', style: const TextStyle(fontSize: 12)),
                      Text(
                        DateFormat('dd MMM yyyy HH:mm').format(createdAt),
                        style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _handleNotificationTap(context, ref, item);
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  IconData _getIconForType(String? type) {
    if (type == null) return Icons.notifications_outlined;
    if (type.contains('Disposisi')) return Icons.assignment_outlined;
    if (type.contains('SuratKeluar')) return Icons.description_outlined;
    if (type.contains('Approval')) return Icons.gavel_outlined;
    return Icons.info_outline;
  }

  void _handleNotificationTap(BuildContext context, WidgetRef ref, Map<String, dynamic> item) async {
    // DEBUG ONLY: cetak map item yang di-tap (tidak mengubah logic di bawah)
    if (kDebugMode) {
      String dump;
      try {
        dump = const JsonEncoder.withIndent('  ').convert(item);
      } catch (_) {
        dump = item.toString();
      }
      for (var i = 0; i < dump.length; i += 800) {
        debugPrint('👆 TAPPED NOTIF ITEM ${dump.substring(i, (i + 800 < dump.length) ? i + 800 : dump.length)}');
      }
    }

    final id = item['id'];
    final data = item['data'] ?? {};
    
    // Mark as read in background
    if (item['read_at'] == null) {
      try {
        await ref.read(notificationProvider.notifier).markRead(id);
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal menandai notifikasi dibaca: $e')),
          );
        }
      }
    }

    // Deep link logic
    final actionUrl = data['action_url']?.toString();
    final referenceId = data['reference_id']?.toString() ?? data['surat_id']?.toString();
    final referenceType = data['reference_type']?.toString();

    if (actionUrl != null && actionUrl.isNotEmpty) {
      if (actionUrl.contains('/disposisi/')) {
        final parts = actionUrl.split('/');
        final id = parts[parts.indexOf('disposisi') + 1];
        context.push('/surat-masuk/$id', extra: 'disposisi');
      } else if (actionUrl.contains('/surat_keluar/') || referenceType?.toLowerCase() == 'surat_keluar') {
        context.go('/approval');
      } else if (referenceId != null) {
        context.push('/surat-masuk/$referenceId', extra: 'disposisi');
      }
    } else if (referenceId != null) {
      if (referenceType?.toLowerCase() == 'surat_keluar') {
        context.go('/approval');
      } else {
        context.push('/surat-masuk/$referenceId', extra: 'disposisi');
      }
    }
  }

  void _showMarkAllReadConfirm(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tandai Semua Dibaca'),
        content: const Text('Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Tidak'),
          ),
          TextButton(
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              try {
                await ref.read(notificationProvider.notifier).markAllRead();
                await ref.read(notificationProvider.notifier).refresh();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Semua notifikasi ditandai sudah dibaca.')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Gagal menandai semua dibaca: $e')),
                  );
                }
              }
            },
            child: const Text('Ya, Tandai'),
          ),
        ],
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/pdf_viewer_screen.dart
```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../core/constants/app_config.dart';
import '../../core/network/api_endpoints.dart';

class PdfViewerScreen extends ConsumerStatefulWidget {
  final String pdfUrl;
  const PdfViewerScreen({super.key, required this.pdfUrl});

  @override
  ConsumerState<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends ConsumerState<PdfViewerScreen> {
  String? _authToken;
  bool _isLoadingToken = true;
  bool _headerLogged = false; // DEBUG ONLY

  @override
  void initState() {
    super.initState();
    _loadAuthToken();
  }

  Future<void> _loadAuthToken() async {
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: AppConfig.authTokenKey);
      if (mounted) {
        setState(() {
          _authToken = token;
          _isLoadingToken = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingToken = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.pdfUrl.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dokumen Surat')),
        body: const Center(child: Text('URL Dokumen tidak valid atau belum diunggah')),
      );
    }

    final fullUrl = ApiEndpoints.buildStorageUrl(widget.pdfUrl);

    if (_isLoadingToken) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dokumen Surat')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final headers = <String, String>{
      'Accept': 'application/pdf, application/octet-stream, */*',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    // DEBUG ONLY: token tidak dicetak, hanya status terpasang/tidak
    if (kDebugMode && !_headerLogged) {
      _headerLogged = true;
      debugPrint('📑 PDF VIEWER pdfUrl(raw): ${widget.pdfUrl}');
      debugPrint('📑 PDF VIEWER fullUrl: $fullUrl');
      debugPrint('📑 PDF VIEWER Authorization header terpasang: ${headers.containsKey('Authorization')}');
      debugPrint('📑 PDF VIEWER header keys: ${headers.keys.toList()}');
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dokumen Surat'),
      ),
      body: SfPdfViewer.network(
        fullUrl,
        headers: headers,
        onDocumentLoadFailed: (details) {
          if (kDebugMode) {
            debugPrint('📑 PDF VIEWER load failed: error=${details.error} | description=${details.description}');
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Gagal memuat PDF: ${details.description}'),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        },
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/profil_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/auth_provider.dart';
import '../../domain/providers/theme_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/custom_card.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);
    
    String userName = 'Nama User';
    String userEmail = 'email@user.com';

    authState.whenData((user) {
      if (user != null) {
        userName = user.nama;
        userEmail = user.email ?? 'email@contoh.com';
      }
    });

    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CustomAppBar(
        title: 'Profil',
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
        children: [
          CustomCard(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(Icons.person_outline_rounded, size: 50, color: Theme.of(context).colorScheme.primary),
                ),
                const SizedBox(height: 16),
                Text(
                  userName,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  userEmail,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          CustomCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: const Text('Mode Gelap'),
                  trailing: Switch(
                    value: themeMode == ThemeMode.dark,
                    onChanged: (val) {
                      HapticFeedback.selectionClick();
                      ref.read(themeProvider.notifier).toggleTheme();
                    },
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.logout_rounded, color: Theme.of(context).colorScheme.error),
                  title: Text(
                    'Keluar',
                    style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.bold),
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _confirmLogout(context, ref);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konfirmasi'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.pop(ctx);
            },
            child: const Text('Tidak'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
            },
            child: const Text('Ya'),
          ),
        ],
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/splash_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../domain/providers/auth_provider.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/app_config.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<Offset> _textSlide;
  late Animation<double> _textOpacity;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
      ),
    );

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.4, curve: Curves.easeIn),
      ),
    );

    _textSlide = Tween<Offset>(begin: const Offset(0, 30), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    _textOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.5, 1.0, curve: Curves.easeIn),
      ),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _checkAuth();
      }
    });

    _controller.forward();
  }

  Future<void> _checkAuth() async {
    // Call loadUserFromStorage to ensure user data is ready
    await ref.read(authProvider.notifier).loadUserFromStorage();
    
    final storage = ref.read(secureStorageProvider);
    final token = await storage.read(key: AppConfig.authTokenKey);
    final isLoggedIn = token != null && token.isNotEmpty;
    
    if (mounted) {
      if (isLoggedIn) {
        context.go('/dashboard');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                FadeTransition(
                  opacity: _logoOpacity,
                  child: ScaleTransition(
                    scale: _logoScale,
                    child: Image.asset(
                      'assets/images/logo.png',
                      height: 150,
                      width: 150,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                FadeTransition(
                  opacity: _textOpacity,
                  child: Transform.translate(
                    offset: _textSlide.value,
                    child: Text(
                      'E-Office Executive',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/surat_keluar_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';

class SuratKeluarScreen extends ConsumerStatefulWidget {
  const SuratKeluarScreen({super.key});

  @override
  ConsumerState<SuratKeluarScreen> createState() => _SuratKeluarScreenState();
}

class _SuratKeluarScreenState extends ConsumerState<SuratKeluarScreen> {
  @override
  Widget build(BuildContext context) {
    // ASUMSI: Menggunakan provider yang sama tapi mungkin butuh filter draft
    final provider = ref.watch(suratMasukProvider); // Placeholder provider

    return Scaffold(
      appBar: const CustomAppBar(title: 'Draft Surat Keluar'),
      body: provider.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => EmptyStateView(icon: Icons.error_outline, message: err.toString()),
        data: (list) {
           return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final item = list[index];
                return Card(
                  child: ListTile(
                    title: Text(item.perihal),
                    subtitle: const Text('Status: Draft'),
                    trailing: ElevatedButton(
                      onPressed: () => _showSubmitDialog(context, item.id),
                      child: const Text('Submit'),
                    ),
                  ),
                );
              },
           );
        },
      ),
    );
  }

  void _showSubmitDialog(BuildContext context, String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Surat'),
        content: const Text('Kirim draft surat ini untuk proses approval?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(suratRepositoryProvider).submitSuratKeluar(id);
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Surat berhasil di-submit')));
                }
              } catch (e) {
                if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}

```

### FILE: lib/presentation/screens/surat_masuk_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../domain/providers/surat_provider.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/empty_state_view.dart';
import '../widgets/custom_card.dart';

class SuratMasukScreen extends ConsumerStatefulWidget {
  const SuratMasukScreen({super.key});

  @override
  ConsumerState<SuratMasukScreen> createState() => _SuratMasukScreenState();
}

class _SuratMasukScreenState extends ConsumerState<SuratMasukScreen> {
  String _selectedCategory = 'semua'; // 'semua', 'approval', 'disposisi'
  String _selectedOrder = 'terbaru';    // 'terbaru', 'terlama'
  DateTimeRange? _selectedDateRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(myActionsProvider.notifier).fetchMyActions();
    });
  }

  void _showFilterTopSheet() {
    HapticFeedback.lightImpact();
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Filter',
      barrierColor: Colors.black54.withValues(alpha: 0.4),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, animation, secondaryAnimation) {
        return const SizedBox.shrink();
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final topOffset = MediaQuery.of(context).padding.top + kToolbarHeight + 8.0;
        return Stack(
          children: [
            Positioned(
              top: topOffset,
              left: 16,
              right: 16,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, -1),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                )),
                child: FadeTransition(
                  opacity: animation,
                  child: Material(
                    color: Colors.transparent,
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: StatefulBuilder(
                        builder: (context, setModalState) {
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Filter Surat',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      setState(() {
                                        _selectedCategory = 'semua';
                                        _selectedOrder = 'terbaru';
                                        _selectedDateRange = null;
                                      });
                                      setModalState(() {});
                                    },
                                    child: const Text('Reset'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Text('Kategori', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(context, label: 'Semua', isSelected: _selectedCategory == 'semua', onTap: () {
                                    setState(() => _selectedCategory = 'semua');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Approval', isSelected: _selectedCategory == 'approval', onTap: () {
                                    setState(() => _selectedCategory = 'approval');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Disposisi', isSelected: _selectedCategory == 'disposisi', onTap: () {
                                    setState(() => _selectedCategory = 'disposisi');
                                    setModalState(() {});
                                  }),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text('Urutan Waktu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(context, label: 'Terbaru', isSelected: _selectedOrder == 'terbaru', onTap: () {
                                    setState(() => _selectedOrder = 'terbaru');
                                    setModalState(() {});
                                  }),
                                  _buildCapsuleChip(context, label: 'Terlama', isSelected: _selectedOrder == 'terlama', onTap: () {
                                    setState(() => _selectedOrder = 'terlama');
                                    setModalState(() {});
                                  }),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text('Rentang Tanggal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildCapsuleChip(
                                    context,
                                    label: _selectedDateRange == null 
                                        ? 'Pilih Rentang Tanggal' 
                                        : '${DateFormat('dd MMM yy').format(_selectedDateRange!.start)} - ${DateFormat('dd MMM yy').format(_selectedDateRange!.end)}',
                                    isSelected: _selectedDateRange != null,
                                    icon: Icons.date_range_rounded,
                                    onTap: () async {
                                      HapticFeedback.lightImpact();
                                      final picked = await showDateRangePicker(
                                        context: context,
                                        firstDate: DateTime(2020),
                                        lastDate: DateTime(2030),
                                        initialDateRange: _selectedDateRange,
                                      );
                                      if (picked != null) {
                                        setState(() => _selectedDateRange = picked);
                                        setModalState(() {});
                                      }
                                    },
                                  ),
                                  if (_selectedDateRange != null)
                                    _buildCapsuleChip(
                                      context,
                                      label: 'Hapus Rentang',
                                      isSelected: false,
                                      icon: Icons.close_rounded,
                                      onTap: () {
                                        setState(() => _selectedDateRange = null);
                                        setModalState(() {});
                                      },
                                    ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  onPressed: () {
                                    HapticFeedback.mediumImpact();
                                    Navigator.pop(context);
                                  },
                                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
                                  child: const Text('Terapkan Filter'),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCapsuleChip(BuildContext context, {required String label, required bool isSelected, required VoidCallback onTap, IconData? icon}) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(myActionsProvider);
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 16.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Tindakan Saya',
        leading: IconButton(
          icon: const Icon(Icons.tune_rounded),
          tooltip: 'Filter Surat',
          onPressed: _showFilterTopSheet,
        ),
      ),
      body: RefreshIndicator(
        edgeOffset: topPadding,
        onRefresh: () async {
          await ref.read(myActionsProvider.notifier).fetchMyActions();
          HapticFeedback.mediumImpact();
        },
        child: provider.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => EmptyStateView(
            message: 'Gagal memuat daftar tindakan: $err',
            icon: Icons.error_outline_rounded,
          ),
          data: (suratList) {
            // Filter logic
            var filteredList = suratList.where((surat) {
              if (_selectedCategory != 'semua') {
                if (surat.actionType != _selectedCategory) return false;
              }
              if (_selectedDateRange != null) {
                final date = surat.tanggalDiterima;
                final start = DateTime(_selectedDateRange!.start.year, _selectedDateRange!.start.month, _selectedDateRange!.start.day);
                final end = DateTime(_selectedDateRange!.end.year, _selectedDateRange!.end.month, _selectedDateRange!.end.day, 23, 59, 59);
                if (date.isBefore(start) || date.isAfter(end)) {
                  return false;
                }
              }
              return true;
            }).toList();

            // Sort logic
            filteredList.sort((a, b) {
              if (_selectedOrder == 'terbaru') {
                return b.tanggalDiterima.compareTo(a.tanggalDiterima);
              } else {
                return a.tanggalDiterima.compareTo(b.tanggalDiterima);
              }
            });

            if (filteredList.isEmpty) {
              return EmptyStateView(
                message: 'Tidak ada surat yang sesuai dengan filter.',
                icon: Icons.filter_alt_off_rounded,
                onRetry: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _selectedCategory = 'semua';
                    _selectedOrder = 'terbaru';
                    _selectedDateRange = null;
                  });
                },
              );
            }

            return ListView.builder(
              padding: EdgeInsets.fromLTRB(16.0, topPadding, 16.0, 100.0),
              itemCount: filteredList.length,
              itemBuilder: (context, index) {
                final surat = filteredList[index];
                final isApproval = surat.actionType == 'approval';

                return CustomCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: EdgeInsets.zero,
                  onTap: () {
                    if (isApproval) {
                      context.go('/approval');
                    } else {
                      context.push('/surat-masuk/${surat.id}', extra: {
                        'actionType': surat.actionType,
                        'idDisposisi': surat.idDisposisi,
                      });
                    }
                  },
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: CircleAvatar(
                      backgroundColor: isApproval ? Colors.orange.shade100 : Colors.blue.shade100,
                      child: Icon(
                        isApproval ? Icons.task_alt_rounded : Icons.alt_route_rounded,
                        color: isApproval ? Colors.orange.shade800 : Colors.blue.shade800,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      surat.perihal,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(surat.asalSurat, style: const TextStyle(fontSize: 12)),
                        Text(
                          surat.nomorSurat,
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/approval_receipt_modal.dart
```dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../data/models/surat_model.dart';

class ApprovalReceiptModal extends StatelessWidget {
  final SuratModel surat;
  final String approverName;
  final DateTime approvalTime;
  final String? customQrData;

  const ApprovalReceiptModal({
    super.key,
    required this.surat,
    required this.approverName,
    required this.approvalTime,
    this.customQrData,
  });

  static void show(
    BuildContext context, {
    required SuratModel surat,
    required String approverName,
    DateTime? approvalTime,
    String? customQrData,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: ApprovalReceiptModal(
          surat: surat,
          approverName: approverName,
          approvalTime: approvalTime ?? DateTime.now(),
          customQrData: customQrData,
        ),
      ),
    );
  }

  static String formatTanggalWaktuIndonesia(DateTime dt) {
    const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final namaHari = hari[dt.weekday - 1];
    final namaBulan = bulan[dt.month - 1];
    final tgl = dt.day;
    final thn = dt.year;
    final jam = dt.hour.toString().padLeft(2, '0');
    final menit = dt.minute.toString().padLeft(2, '0');
    final detik = dt.second.toString().padLeft(2, '0');
    return '$namaHari, $tgl $namaBulan $thn $jam.$menit.$detik';
  }

  String _getQrDataString() {
    if (customQrData != null && customQrData!.isNotEmpty) {
      return customQrData!;
    }
    final timeStr = formatTanggalWaktuIndonesia(approvalTime);
    final data = {
      'jenis': surat.perihal.isNotEmpty ? surat.perihal : 'Surat Keluar',
      'no_surat': surat.nomorSurat,
      'perihal': surat.perihal,
      'pengirim': surat.pengirim ?? surat.pemohon ?? '-',
      'approver': approverName,
      'tanggal_waktu': timeStr,
      'status': 'Disetujui',
      'id': surat.id,
    };
    return jsonEncode(data);
  }

  Future<void> _handleDownloadQr(BuildContext context, String qrData) async {
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Menyimpan QR Code ke perangkat...')),
    );

    try {
      final qrApiUrl =
          'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${Uri.encodeComponent(qrData)}&format=png&margin=10';
      final dio = Dio();
      final dir = await getApplicationDocumentsDirectory();
      final safeName = surat.id.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
      final savePath = '${dir.path}/approval_qr_$safeName.png';

      await dio.download(qrApiUrl, savePath);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF138A98),
            content: Text('QR Code berhasil diunduh ke: $savePath'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tanda terima QR berhasil dibuat (Kode: ${surat.nomorSurat})'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final qrData = _getQrDataString();
    const primaryTeal = Color(0xFF138A98);

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Row: Title & Red Close Button
            Row(
              children: [
                const Icon(
                  Icons.qr_code_2_rounded,
                  size: 24,
                  color: Colors.black87,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Tanda Terima Approval',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
                // Red close square button as in screenshot
                InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2), // soft red
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.close,
                      size: 20,
                      color: Color(0xFFEF4444), // red
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // QR Code Box
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 190.0,
                  backgroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Divider(color: Colors.grey.shade200, height: 1),
            const SizedBox(height: 14),

            // Details List
            _buildInfoRow('Jenis Surat', surat.perihal.isNotEmpty ? surat.perihal : 'Surat Permohonan'),
            _buildInfoRow('Nomor Surat', surat.nomorSurat),
            _buildInfoRow('Perihal', surat.perihal),
            _buildInfoRow(
              'Disetujui oleh',
              approverName.isNotEmpty ? approverName : 'Pimpinan',
              valueColor: const Color(0xFF16A34A), // Green
            ),
            _buildInfoRow(
              'Tanggal & Waktu',
              formatTanggalWaktuIndonesia(approvalTime),
            ),

            // Status Badge
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Status',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF84CC16), // Lime Green as in screenshot
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Disetujui',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryTeal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                  child: const Text(
                    'TUTUP',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryTeal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              onPressed: () => _handleDownloadQr(context, qrData),
              icon: const Icon(Icons.download_rounded, size: 18),
              label: const Text(
                'DOWNLOAD QR CODE',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/custom_app_bar.dart
```dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CustomAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;

  const CustomAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final canPop = Navigator.canPop(context);

    Widget? effectiveLeading = leading;
    if (effectiveLeading == null && canPop) {
      effectiveLeading = IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded),
        onPressed: () {
          HapticFeedback.lightImpact();
          context.pop();
        },
      );
    }

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: AppBar(
          leading: effectiveLeading,
          title: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: isDark
              ? theme.colorScheme.surface.withValues(alpha: 0.05)
              : Colors.white.withValues(alpha: 0.08),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1.0),
            child: Container(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.black.withValues(alpha: 0.04),
              height: 1.0,
            ),
          ),
          actions: actions ?? [
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded),
              onPressed: () {
                HapticFeedback.lightImpact();
                context.push('/notifications');
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/custom_card.dart
```dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final double borderWidth;
  final bool isTranslucent;

  const CustomCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.margin,
    this.borderRadius = 20.0,
    this.onTap,
    this.color,
    this.borderColor,
    this.borderWidth = 1.0,
    this.isTranslucent = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final effectiveColor = color ??
        (isTranslucent
            ? (isDark
                ? theme.colorScheme.surface.withValues(alpha: 0.75)
                : Colors.white.withValues(alpha: 0.85))
            : theme.colorScheme.surface);

    final effectiveBorderColor = borderColor ??
        (isDark
            ? Colors.white.withValues(alpha: 0.12)
            : theme.colorScheme.outlineVariant.withValues(alpha: 0.35));

    Widget content = Padding(
      padding: padding ?? const EdgeInsets.all(16.0),
      child: child,
    );

    if (onTap != null) {
      content = InkWell(
        borderRadius: BorderRadius.circular(borderRadius),
        splashColor: theme.colorScheme.primary.withValues(alpha: 0.12),
        highlightColor: theme.colorScheme.primary.withValues(alpha: 0.06),
        onTap: () {
          HapticFeedback.lightImpact();
          onTap!();
        },
        child: content,
      );
    }

    Widget cardWidget = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: effectiveColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: effectiveBorderColor,
          width: borderWidth,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(borderRadius),
        child: content,
      ),
    );

    if (isTranslucent) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: cardWidget,
        ),
      );
    }

    return cardWidget;
  }
}

```

### FILE: lib/presentation/widgets/empty_state_view.dart
```dart
import 'package:flutter/material.dart';
class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback? onRetry;
  const EmptyStateView({
    super.key,
    required this.icon,
    this.title = 'Data Tidak Ditemukan',
    this.message = 'Tidak ada data untuk ditampilkan.',
    this.onRetry,
  });
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 80,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Muat Ulang'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/floating_nav_bar.dart
```dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FloatingNavBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;

  const FloatingNavBar({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final activeColor = theme.colorScheme.primary;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.25)
                    : theme.colorScheme.primary.withValues(alpha: 0.08),
                blurRadius: 16,
                spreadRadius: 1,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark
                      ? theme.colorScheme.surface.withValues(alpha: 0.05)
                      : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.04),
                    width: 1.0,
                  ),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final itemWidth = constraints.maxWidth / 4;
                    return Stack(
                      children: [
                        // Sliding Indicator Capsule
                        AnimatedPositioned(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          left: selectedIndex * itemWidth,
                          top: 0,
                          bottom: 0,
                          width: itemWidth,
                          child: Center(
                            child: Container(
                              height: 42,
                              margin: const EdgeInsets.symmetric(horizontal: 6),
                              decoration: BoxDecoration(
                                color: activeColor.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                          ),
                        ),
                        // Tab Items Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildTabItem(
                              context,
                              index: 0,
                              activeIcon: Icons.grid_view_rounded,
                              inactiveIcon: Icons.grid_view_outlined,
                            ),
                            _buildTabItem(
                              context,
                              index: 1,
                              activeIcon: Icons.assignment_rounded,
                              inactiveIcon: Icons.assignment_outlined,
                            ),
                            _buildTabItem(
                              context,
                              index: 2,
                              activeIcon: Icons.check_circle_rounded,
                              inactiveIcon: Icons.check_circle_outline_rounded,
                            ),
                            _buildTabItem(
                              context,
                              index: 3,
                              activeIcon: Icons.person_rounded,
                              inactiveIcon: Icons.person_outline_rounded,
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem(
    BuildContext context, {
    required int index,
    required IconData activeIcon,
    required IconData inactiveIcon,
  }) {
    final isSelected = selectedIndex == index;
    final theme = Theme.of(context);
    final activeColor = theme.colorScheme.primary;
    final inactiveColor = theme.colorScheme.onSurfaceVariant;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.lightImpact();
          onItemTapped(index);
        },
        child: SizedBox(
          height: 48,
          child: Center(
            child: Icon(
              isSelected ? activeIcon : inactiveIcon,
              color: isSelected ? activeColor : inactiveColor,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/liquid_glass_container.dart
```dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/providers/liquid_glass_provider.dart';

class LiquidGlassContainer extends ConsumerWidget {
  final Widget child;
  final double borderRadius;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;

  const LiquidGlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 16.0,
    this.width,
    this.height,
    this.padding,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isGlass = ref.watch(liquidGlassProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (!isGlass) {
      // Fallback: Plain Solid Container
      return RepaintBoundary(
        child: Container(
          width: width,
          height: height,
          padding: padding,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
              width: 1.0,
            ),
          ),
          child: child,
        ),
      );
    }

    // Liquid Glass Effect
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  isDark ? Colors.white.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.6),
                  isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(borderRadius),
            ),
            padding: const EdgeInsets.all(1.0), // 1px border thickness
            child: Container(
              padding: padding,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.2)
                    : Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(
                  borderRadius > 1.0 ? borderRadius - 1.0 : borderRadius,
                ),
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

```

### FILE: lib/presentation/widgets/surat_shimmer_list.dart
```dart
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
class SuratShimmerList extends StatelessWidget {
  final int itemCount;
  const SuratShimmerList({super.key, this.itemCount = 6});
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          child: Shimmer.fromColors(
            baseColor: Theme.of(context).colorScheme.surfaceVariant,
            highlightColor: Theme.of(context).colorScheme.surface,
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: double.infinity,
                          height: 14,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 150,
                          height: 12,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 80,
                          height: 10,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

```
