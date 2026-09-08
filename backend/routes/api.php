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
Route::post('surat_keluar/upload', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'uploadAttachment'])->middleware('EnsureHasGroup:surat_keluar,add');
Route::get('surat_keluar/nomor-agenda-preview', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'nomorAgendaPreview'])->middleware('EnsureHasGroup:surat_keluar,index');
Route::get('surat_keluar/recipients', [App\Http\Controllers\API\SuratKeluarAPIController::class, 'recipients'])->middleware('EnsureHasGroup:surat_keluar,index');
Route::resource('surat_keluar', App\Http\Controllers\API\SuratKeluarAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_keluar');
Route::resource('surat_distribusi', App\Http\Controllers\API\SuratDistribusiAPIController::class)
    ->except(['create', 'edit'])->middleware('EnsureHasGroup:surat_masuk|surat_masuk_pegawai');
Route::post('surat_disposisi/{id}/complete', [App\Http\Controllers\API\EOfficeWorkflowController::class, 'completeDisposition'])->middleware('EnsureHasGroup:disposisi,edit');
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
Route::post('eoffice/notifications/{id}/read', [App\Http\Controllers\API\EOfficeSupportController::class, 'markNotificationRead']);
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
