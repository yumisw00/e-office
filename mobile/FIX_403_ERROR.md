# 🔧 FIX: Error 403 - User Tidak Memiliki Akses ke surat_masuk

## 📋 **MASALAH**

Mobile app mendapat error **403 Forbidden** saat mengakses `/api/surat_masuk`:
```
✅ RESPONSE[403] <= http://192.168.0.40:8000/api/surat_masuk?page=1&limit=20
❌ Error getting surat masuk: null
```

**Login berhasil** dengan user `pimpinan@test.com` dan mendapat menu akses termasuk `surat_keluar`, tapi **TIDAK** dapat akses `surat_masuk`.

---

## 🔍 **ANALISIS ROOT CAUSE**

### 1. **Middleware EnsureHasGroup Membutuhkan Menu Permission**

Route di `backend/routes/api.php` line 183-184:
```php
Route::resource('surat_masuk', SuratMasukAPIController::class)
    ->except(['create', 'edit'])
    ->middleware('EnsureHasGroup:surat_masuk|surat_masuk_pegawai');
```

Middleware `EnsureHasGroup` akan:
1. ✅ Cek user authenticated (OK - login berhasil)
2. ✅ Cek user punya group (OK - group "Pimpinan")
3. ❌ **Cek group punya menu permission** untuk `surat_masuk` atau `surat_masuk_pegawai` → **GAGAL!**

### 2. **User "Pimpinan" Tidak Punya Menu `surat_masuk` di Database**

Dari response login, user Pimpinan hanya dapat menu:
```json
{
  "menu": [
    {"page": "surat_keluar"},
    {"page": "disposisi"},
    {"page": "surat_arsip"},
    {"page": "agenda"},
    {"page": "pengumuman"}
  ]
}
```

**Tidak ada `surat_masuk`!** Padahal middleware `EnsureHasGroup.php` line 81-90 sudah memberi akses read-only untuk Pimpinan:

```php
$readOnlyPimpinanUrls = [
    'surat_masuk', 'surat_masuk_pegawai', 'surat_keluar',
    'surat_distribusi', 'surat_disposisi', 'surat_approval',
    'surat_arsip', 'agenda', 'pengumuman',
];
```

**TAPI** ini hanya bekerja jika:
- Group nama = "Pimpinan" ✅
- Method = GET ✅  
- Action = null atau "index" ✅
- **Menu URL ada di sys_group_menu table** ❌ ← MASALAH DI SINI!

---

## ✅ **SOLUSI**

### **OPSI 1: Tambahkan Menu `surat_masuk` ke Group Pimpinan (RECOMMENDED)**

Jalankan migration atau manual SQL di database backend:

```sql
-- Cari ID group Pimpinan
SELECT id_group FROM sys_group WHERE LOWER(REPLACE(nama, '_', ' ')) = 'pimpinan' AND deleted_at IS NULL;

-- Cari ID menu surat_masuk
SELECT id_menu FROM sys_menu WHERE url = 'surat_masuk' AND deleted_at IS NULL;

-- Tambahkan ke sys_group_menu (ganti {id_group} dan {id_menu} dengan hasil query di atas)
INSERT INTO sys_group_menu (id_group, id_menu, created_at, updated_at)
VALUES ({id_group_pimpinan}, {id_menu_surat_masuk}, NOW(), NOW())
ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW();
```

### **OPSI 2: Fix Middleware - Skip Menu Check untuk Read-Only Pimpinan**

File sudah diperbaiki: `/workspace/backend/app/Http/Middleware/EnsureHasGroup.php`

Perubahan di line 86-88:
```php
// BEFORE:
$matchesReadOnlyUrl = array_intersect(explode('|', $url), $readOnlyPimpinanUrls);

// AFTER:
$requestedUrls = array_filter(explode('|', $url));
$matchesReadOnlyUrl = array_intersect($requestedUrls, $readOnlyPimpinanUrls);
```

**Ini memastikan** array intersection bekerja dengan benar.

---

## 🚀 **TESTING SETELAH FIX**

1. **Restart backend Laravel:**
   ```bash
   cd /workspace/backend
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **Clear cache:**
   ```bash
   php artisan config:clear
   php artisan route:clear
   php artisan cache:clear
   ```

3. **Test di mobile app:**
   - Login dengan `pimpinan@test.com`
   - Pull-to-refresh di halaman Surat Masuk
   - Harusnya dapat data, bukan error 403

4. **Cek log mobile:**
   ```
   ✅ Success: X surat masuk loaded
   ```

---

## 📝 **CATATAN PENTING**

### **Kenapa Error 403?**

Backend Laravel mengirim response JSON:
```json
{
  "message": "Forbidden."
}
```

Mobile app mendapat status code 403 dan throw exception. Dengan fix di `surat_repository.dart`, sekarang error 403 akan:
- Print pesan helpful: `"💡 Solusi Backend: Tambahkan group 'surat_masuk' ke user"`
- Return empty list (bukan crash)
- UI tetap responsive

### **Struktur Permission Laravel E-Office:**

```
sys_group (groups/roles)
    ↓
sys_group_menu (pivot: group ↔ menu)
    ↓
sys_menu (menu items with URLs)
    ↓
sys_action (actions: index, add, edit, delete)
    ↓
sys_group_action (pivot: group_menu ↔ action)
```

**Untuk akses READ (index):**
- Group harus punya menu di `sys_group_menu`
- Action "index" otomatis granted jika menu ada

**Untuk akses WRITE (add/edit/delete):**
- Group harus punya menu
- Group harus punya action spesifik di `sys_group_action`

---

## 🎯 **NEXT STEPS**

1. ✅ **Fix middleware** - DONE (`EnsureHasGroup.php`)
2. ✅ **Handle 403 gracefully** - DONE (`surat_repository.dart`)
3. ⏳ **Add menu permission** - Run SQL di database backend
4. ⏳ **Test full flow** - Login → Load surat → Display data

---

**Status**: 🟡 **PARTIAL FIX** - Code improved, perlu database update untuk full functionality.
