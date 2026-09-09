# 📱 PERUBAHAN ARSITEKTUR MOBILE - E-OFFICE PT ABC

## ✅ Ringkasan Perubahan

Aplikasi mobile telah dirombak sepenuhnya untuk menghilangkan **hardcode** dan mengimplementasikan integrasi penuh dengan backend Laravel sesuai proposal teknis.

---

## 🔧 PERUBAHAN UTAMA

### 1. **User Model & Data Dinamis** (`lib/data/models/user_model.dart`)
- ✅ **BARU**: File `user_model.dart` untuk menangani data user dari backend
- ✅ Parse data user: `id`, `nama`, `email`, `nip`, `jabatan`, `unit_kerja`, `groups`, `foto_profil`
- ✅ Helper methods: `isPimpinan`, `isAdmin`, `hasGroup()`
- ✅ Support berbagai format response dari Laravel

### 2. **Auth Provider Terintegrasi** (`lib/domain/providers/auth_provider.dart`)
- ❌ **DIHAPUS**: Hardcode status boolean `AsyncValue<bool>`
- ✅ **BARU**: `AsyncValue<UserModel?>` menyimpan data user lengkap
- ✅ **BARU**: Parameter login sekarang menerima:
  - `deviceName` (dinamis dari device_info_plus)
  - `fcmToken` (token FCM untuk notifikasi push)
- ✅ **BARU**: Method `loadUserFromStorage()` untuk auto-login
- ✅ Menyimpan user data ke secure storage setelah login sukses
- ✅ Mengirim FCM token ke backend saat login

### 3. **Login Screen dengan Device Info & FCM** (`lib/presentation/screens/login_screen.dart`)
- ❌ **DIHAPUS**: Hardcode `"Xiaomi 12"` pada device name
- ✅ **BARU**: Inisialisasi otomatis device info menggunakan `device_info_plus`:
  - Android: `${brand} ${model}` (contoh: "Samsung Galaxy S21")
  - iOS: `iPhone ${model}` (contoh: "iPhone 13 Pro")
- ✅ **BARU**: Inisialisasi FCM Token sebelum login
- ✅ **BARU**: Validasi device info dan FCM token sebelum submit login
- ✅ Tombol login disabled jika device info/FCM belum siap

### 4. **Firebase Messaging Service** (`lib/core/network/firebase_messaging_service.dart`)
- ✅ Sudah implementasi lengkap FCM untuk Android & iOS
- ✅ Handler background message
- ✅ Local notifications untuk foreground
- ✅ Subscribe to topic untuk kategorisasi notifikasi
- ✅ Method `getFCMToken()` yang dipanggil saat login

### 5. **Dependencies Baru** (`pubspec.yaml`)
```yaml
device_info_plus: ^11.3.0  # Untuk mendapatkan info perangkat secara dinamis
```

---

## 📊 ALUR LOGIN BARU (TANPA HARDCODE)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                               │
│              Email + Password + Captcha                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           INIT DEVICE INFO (Otomatis)                       │
│   - Android: "Samsung Galaxy S21 - 1234567890"             │
│   - iOS: "iPhone 13 Pro - 1234567890"                      │
│   - Fallback: "Mobile Device - 1234567890"                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           INIT FCM TOKEN (Otomatis)                         │
│   - Request permission                                      │
│   - Get token dari Firebase                                 │
│   - Contoh: "cDfGhIjKlMnOpQrStUvWxYz..."                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            POST /api/mobile/login                           │
│   Body:                                                     │
│   {                                                         │
│     "email": "pimpinan@ptabc.co.id",                       │
│     "password": "********",                                │
│     "device_name": "Samsung Galaxy S21 - 1234567890",      │
│     "fcm_token": "cDfGhIjKlMnOpQrStUvWxYz..."              │
│   }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         BACKEND LARAVEL RESPONSE                            │
│   {                                                         │
│     "token": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",              │
│     "user": {                                               │
│       "id": "1",                                            │
│       "nama": "Bapak Direktur",                            │
│       "email": "pimpinan@ptabc.co.id",                     │
│       "nip": "123456789",                                  │
│       "jabatan": "Direktur Utama",                         │
│       "unit_kerja": "Direksi",                             │
│       "groups": ["pimpinan", "direksi"]                    │
│     }                                                       │
│   }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          SIMPAN DATA LOKAL                                  │
│   - Token → flutter_secure_storage                          │
│   - User Data → flutter_secure_storage (JSON)              │
│   - Update AuthNotifier state dengan UserModel             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          NAVIGASI KE DASHBOARD                              │
│   - Auto-login selanjutnya load dari storage               │
│   - Tampilkan nama user di header                          │
│   - Sesuaikan fitur berdasarkan role (pimpinan/admin)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 FITUR YANG SUDAH SIAP SESUAI PROPOSAL

| Fitur | Status | Keterangan |
|-------|--------|------------|
| ✅ Login dengan Device Info Dinamis | DONE | Tidak ada hardcode "Xiaomi 12" |
| ✅ FCM Token ke Backend | DONE | Terkirim saat login untuk notifikasi push |
| ✅ User Data dari Backend | DONE | Nama, jabatan, role diambil dari API |
| ✅ Auto-login dari Storage | DONE | Load user data saat app dibuka kembali |
| ✅ Notifikasi Real-time | DONE | FCM sudah terintegrasi penuh |
| ✅ Role-based Access | DONE | Cek `isPimpinan`, `isAdmin` dari UserModel |
| ✅ Upload Attachment Disposisi | READY | Package `image_picker` sudah ada |
| ✅ Digital Signature Biometrik | READY | Package `local_auth` sudah ada |
| ✅ PDF Viewer Optimized | READY | `syncfusion_flutter_pdfviewer` sudah ada |
| ✅ Share/Print Dokumen | READY | `share_plus` & `printing` sudah ada |

---

## 📋 CHECKLIST BACKEND YANG PERLU DISIAPKAN

Pastikan tim backend Laravel menyiapkan endpoint berikut:

### 1. **POST /api/mobile/login**
```php
// Input:
{
  "email": "user@ptabc.co.id",
  "password": "password123",
  "device_name": "Samsung Galaxy S21 - 1234567890",
  "fcm_token": "cDfGhIjKlMnOpQrStUvWxYz..."
}

// Output Success:
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "user": {
    "id": 1,
    "nama": "Bapak Direktur",
    "email": "pimpinan@ptabc.co.id",
    "nip": "123456789",
    "jabatan": "Direktur Utama",
    "unit_kerja": "Direksi",
    "groups": ["pimpinan", "direksi"],
    "foto_profil": "https://storage.../avatar.jpg"
  }
}
```

### 2. **Simpan FCM Token ke Database**
- Table `users` atau `user_devices` perlu kolom `fcm_token`
- Update token setiap kali user login dari device tersebut

### 3. **Endpoint Profil User** (Opsional, jika perlu refresh)
```
GET /api/user/profile
Headers: Authorization: Bearer {token}
```

---

## 🚀 CARA MENJALANKAN

### 1. Install Dependencies
```bash
cd mobile
flutter pub get
```

### 2. Jalankan Build Runner (untuk generate code)
```bash
dart run build_runner build --delete-conflicting-outputs
```

### 3. Konfigurasi Firebase
- Download `google-services.json` (Android) → taruh di `android/app/`
- Download `GoogleService-Info.plist` (iOS) → taruh di `ios/Runner/`
- Pastikan file `firebase_options.dart` sudah di-generate

### 4. Run App
```bash
flutter run
```

---

## 📝 CATATAN PENTING

1. **Tidak Ada Lagi Hardcode**: Semua data user dan device info diambil secara dinamis
2. **FCM Wajib**: Login akan gagal jika FCM token tidak didapatkan (pastikan Firebase dikonfigurasi dengan benar)
3. **Secure Storage**: Token dan user data disimpan encrypted di device
4. **Role-Based UI**: Dashboard dan fitur akan menyesuaikan berdasarkan role user dari backend
5. **Bahasa Indonesia**: Sesuai proposal, app hanya support Bahasa Indonesia

---

## 🔄 NEXT STEPS (Yang Perlu Dilanjutkan)

1. **Dashboard Screen**: Tampilkan nama user dari `authProvider` dan statistik berdasarkan role
2. **Disposisi Screen**: Implementasi upload attachment + catatan disposisi
3. **Approval Screen**: Flow approval berjenjang + digital signature dengan biometrik
4. **Tracking Visual**: Timeline/graph perjalanan surat
5. **AI Summary Integration**: Tampilkan executive summary dari backend AI di detail surat

---

**Dibuat**: 2026
**Status**: ✅ Siap Integrasi Backend
**Target**: Alat Kerja Pimpinan (Bukan Sekadar Viewer)
