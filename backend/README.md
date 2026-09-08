# E-Office Backend

Backend E-Office berbasis Laravel/PHP untuk web dan mobile. Project ini mengikuti dokumen kebutuhan `E (1).docx`: Laravel 11+/PHP 8.2+, PostgreSQL, RBAC, audit trail immutable, surat masuk OCR, workflow surat keluar, disposisi, arsip, notifikasi, dan backup database.

## Stack

- PHP 8.2+
- Laravel 12
- PostgreSQL
- Laravel Sanctum/session auth
- bcrypt password hashing
- Gemini API untuk OCR surat masuk
- `pg_dump` untuk backup database PostgreSQL

## Setup Lokal

```powershell
cd D:\e-office\backend
composer install
php artisan key:generate
php artisan config:clear
php artisan route:clear
php artisan serve --host=0.0.0.0 --port=8000
```

Pastikan `.env` berisi koneksi PostgreSQL dan `GEMINI_API_KEY`. File `.env` tidak boleh dipush.

## Endpoint Utama

Endpoint Sprint 1-4 yang dipakai frontend mengembalikan bentuk umum:

```json
{
  "success": true,
  "data": []
}
```

Untuk list dengan pagination, backend juga menyertakan `page`, `page_size`, `total_page`, dan `total_records`.

### Health

```http
GET /api/health
```

### Auth dan Session

```http
GET /api/user
GET /api/get_session
POST /login
POST /logout
```

### RBAC dan Admin Sistem

```http
GET /api/sys_user
POST /api/sys_user
PUT /api/sys_user/{id}
DELETE /api/sys_user/{id}

GET /api/sys_group
PUT /api/sys_group/setmenu/{id_group}
GET /api/sys_group/getmenu/{id_group}

GET /api/sys_menu
GET /api/sys_action
GET /api/access/{action}/{url_menu}/{group?}
```

Page menu yang disinkronkan:

- Admin Sistem: `dashboard`, `group`, `sys_menu`, `sys_setting`, `backup_database`, `sys_user`, `sys_log`
- Admin Konten: `dashboard`, `surat_masuk`, `surat_keluar`, `surat_template`, `master_organisasi`, `disposisi`, `tracking_surat`, `surat_arsip`, `notifikasi`, `pengumuman`
- Pegawai: `dashboard`, `surat_masuk_pegawai`, `surat_keluar`, `disposisi`, `tracking_surat`, `surat_arsip`, `notifikasi`

### Master Data Organisasi

```http
GET /api/mt_sdm_unit
POST /api/mt_sdm_unit
PUT /api/mt_sdm_unit/{id}
DELETE /api/mt_sdm_unit/{id}

GET /api/mt_sdm_jabatan
POST /api/mt_sdm_jabatan
PUT /api/mt_sdm_jabatan/{id}
DELETE /api/mt_sdm_jabatan/{id}
```

### Surat Masuk

```http
GET /api/surat_masuk
POST /api/surat_masuk
GET /api/surat_masuk/{id}
PUT /api/surat_masuk/{id}
DELETE /api/surat_masuk/{id}
```

Saat create, `nomor_agenda` otomatis dibuat jika kosong dengan format:

```text
SM/YYYY/MM/NNN
```

### Master Data Surat Masuk

```http
GET /api/surat_masuk/master-data
GET /api/surat_masuk/master_data
```

Response berisi pilihan `jenis`, `sifat`, dan `topik`.

### OCR Surat Masuk

```http
POST /api/surat_masuk/ocr
```

Payload minimal:

```json
{
  "file_surat": "surat_masuk/nama-file.pdf"
}
```

Response utama ada di `data`:

```json
{
  "success": true,
  "data": {
    "nomor_surat": "...",
    "asal_surat": "...",
    "perihal": "...",
    "tanggal_surat": "2026-07-03",
    "isi_ringkasan": "..."
  }
}
```

### File Preview

```http
GET /api/getfile/{path}
```

Contoh:

```http
GET /api/getfile/surat_masuk/20260701095241_file.pdf
```

Endpoint mengembalikan file langsung, misalnya `application/pdf`.

### Lifecycle Surat Masuk

```http
POST /api/surat_masuk/{id}/distribute
POST /api/surat_masuk/{id}/read
POST /api/surat_masuk/{id}/done
POST /api/surat_masuk/{id}/archive
GET  /api/surat_masuk/{id}/timeline
```

Status lifecycle utama:

```text
new -> distributed -> read -> disposed -> done
```

### Disposisi

```http
GET /api/surat_disposisi
POST /api/surat_disposisi
PUT /api/surat_disposisi/{id}
POST /api/surat_disposisi/{id}/complete
```

Payload penyelesaian:

```json
{
  "catatan_penyelesaian": "Sudah ditindaklanjuti.",
  "file_bukti_path": "disposisi/bukti.pdf"
}
```

### Surat Keluar

```http
GET /api/surat_keluar
POST /api/surat_keluar
GET /api/surat_keluar/{id}
PUT /api/surat_keluar/{id}
DELETE /api/surat_keluar/{id}
```

### Workflow Surat Keluar

```http
POST /api/surat_keluar/{id}/submit
POST /api/surat_keluar/{id}/approve
POST /api/surat_keluar/{id}/reject
POST /api/surat_keluar/{id}/sign
POST /api/surat_keluar/{id}/send
POST /api/surat_keluar/{id}/archive
GET  /api/surat_keluar/{id}/timeline
```

Status lifecycle utama:

```text
draft -> submitted -> review -> approved -> signed -> sent -> archived
```

Submit dengan approver:

```json
{
  "approvers": [1, 2]
}
```

Reject:

```json
{
  "catatan_revisi": "Perbaiki tujuan surat."
}
```

`sign` membuat QR Code digital signature mock di `storage/app/digital_signature`.

`send` adalah SMTP mock dan mengubah status surat menjadi `sent`.

### Template Surat

```http
GET /api/surat_template
POST /api/surat_template
PUT /api/surat_template/{id}
DELETE /api/surat_template/{id}
POST /api/surat_template/{id}/create-office-link
```

Payload frontend:

```json
{
  "nama_template": "Template Undangan",
  "jenis_surat": "surat_keluar",
  "deskripsi": "Template undangan resmi",
  "file_template": "template-undangan.docx",
  "file_path": "surat_template/template-undangan.docx",
  "is_default": false,
  "status": "active",
  "metadata": {}
}
```

`create-office-link` mengunggah file Word template ke OneDrive/SharePoint lewat Microsoft Graph dan menyimpan `office365_document_url` untuk collaborative editing di Word Online.

### Office 365 / Microsoft Graph

Isi konfigurasi berikut di `.env` backend sebelum memakai tombol `Buat Link Office 365`:

```env
OFFICE365_TENANT_ID=
OFFICE365_CLIENT_ID=
OFFICE365_CLIENT_SECRET=
OFFICE365_DRIVE_ID=
OFFICE365_FOLDER_PATH="E-Office"
OFFICE365_SHARING_SCOPE=organization
OFFICE365_SHARING_TYPE=edit
```

Azure App Registration membutuhkan application permission Microsoft Graph untuk file di drive target, misalnya `Files.ReadWrite.All`, lalu admin consent. `OFFICE365_DRIVE_ID` adalah drive OneDrive/SharePoint tempat dokumen E-Office disimpan.

Endpoint draft surat keluar:

```http
POST /api/surat_keluar/{id}/create-office-link
```

Jika surat keluar belum punya `file_draft_path`, backend membuat `.docx` sederhana dari isi/ringkasan surat, mengunggahnya ke Office 365, lalu menyimpan link edit kolaboratif ke `office365_document_url`.

### Workflow Surat

```http
GET /api/workflow_surat
POST /api/workflow_surat
PUT /api/workflow_surat/{id}
DELETE /api/workflow_surat/{id}
```

Payload:

```json
{
  "nama_workflow": "Workflow Surat Keluar",
  "jenis_surat": "surat_keluar",
  "deskripsi": "Approval berjenjang",
  "steps": [
    { "nama_step": "Pembuat", "role_jabatan": "Admin Konten", "urutan": 1 },
    { "nama_step": "Verifikator", "role_jabatan": "Pimpinan Unit", "urutan": 2 },
    { "nama_step": "Penandatangan", "role_jabatan": "Pimpinan", "urutan": 3 }
  ],
  "is_active": true,
  "status": "active"
}
```

### Pengumuman

```http
GET /api/pengumuman
POST /api/pengumuman
PUT /api/pengumuman/{id}
DELETE /api/pengumuman/{id}
```

Payload:

```json
{
  "judul": "Info E-Office",
  "isi": "Isi pengumuman",
  "target_role": "Admin Konten",
  "tanggal_publish": "2026-07-03 10:00:00",
  "status": "published"
}
```

### Arsip Digital

```http
GET /api/surat_arsip
POST /api/surat_arsip
GET /api/surat_arsip/{id}
```

Surat masuk dan surat keluar juga bisa diarsipkan lewat endpoint lifecycle masing-masing.

### Notifikasi E-Office

```http
GET  /api/eoffice/notifications
POST /api/eoffice/notifications
POST /api/eoffice/notifications/{id}/read
```

Alias:

```http
GET  /api/notifikasi_eoffice
POST /api/notifikasi_eoffice
POST /api/notifikasi_eoffice/{id}/read
```

Payload create:

```json
{
  "id_user": 1,
  "title": "Surat masuk baru",
  "message": "Ada surat masuk yang perlu ditindaklanjuti.",
  "url": "/surat_masuk",
  "payload": {
    "id_surat_masuk": 2
  }
}
```

### Audit Trail Immutable

```http
GET /api/audit_trail_immutable
```

Create/update/delete melalui model utama otomatis menulis hash-chain ke tabel `audit_trail_immutable`.

### Backup Database

```http
GET  /api/backup_database
POST /api/backup_database
GET  /api/backup_database/download/{filename}
```

`POST /api/backup_database` menjalankan `pg_dump` dan menyimpan file `.sql` di `storage/app/backups`.

Backup otomatis tersedia lewat command:

```powershell
php artisan backup:database
```

Scheduler Laravel menjalankan command ini setiap hari pukul `01:00`. Di server, aktifkan scheduler Laravel sesuai standar:

```powershell
php artisan schedule:run
```

## Catatan Integrasi

- Semua endpoint API berjalan di bawah middleware session/auth aplikasi.
- Untuk frontend/mobile, pastikan user sudah login sebelum memanggil endpoint protected.
- File upload surat masuk disimpan di `storage/app/surat_masuk`.
- Preview file gunakan `/api/getfile/{path}`.
- Real-time notification saat ini berbasis database/API polling. Push notification mobile bisa ditambahkan di tahap berikutnya.
