# 📱 PANDUAN IMPLEMENTASI MOBILE E-OFFICE PT ABC
## Berdasarkan Proposal Teknis PT AKTIVITAS INSANI MADANI

---

## ✅ PERUBAHAN YANG SUDAH DILAKUKAN

### 1. **Pembersihan Fitur Berlebihan**
- ❌ **Dihapus**: Multi-bahasa (EN/ID) → Sekarang hanya Bahasa Indonesia
- ❌ **Dihapus**: Liquid Glass/Glassmorphism effects (widget berat)
- ❌ **Dihapus**: File localization yang tidak diperlukan
- ❌ **Dihapus**: Dependencies `flutter_animate` dan `figma_squircle`

### 2. **Penambahan Fitur Wajib (Sesuai Proposal)**
- ✅ **Firebase Cloud Messaging (FCM)**: Notifikasi real-time dengan `flutter_local_notifications`
- ✅ **Biometric Authentication**: `local_auth` untuk digital signature (PIN/Fingerprint)
- ✅ **Image Picker**: Upload attachment disposisi dari kamera/galeri
- ✅ **PDF Viewer Optimized**: `syncfusion_flutter_pdfviewer` dengan zoom & navigasi
- ✅ **Share/Print**: `share_plus` dan `printing` untuk cetak dokumen

### 3. **Konfigurasi Firebase FCM**
File: `lib/core/network/firebase_messaging_service.dart`
- ✅ Handler background message
- ✅ Foreground notification dengan local notifications
- ✅ Handle tap notifikasi untuk navigasi
- ✅ Subscribe to topic (untuk kategorisasi notifikasi)

---

## 📋 CHECKLIST FITUR WAJIB IMPLEMENTASI

### A. NOTIFIKASI REAL-TIME (FCM) 🔔
**Status**: ✅ Service dasar sudah siap

**Yang Perlu Dilengkapi**:
```dart
// 1. Integrasi dengan Backend Laravel
// - Backend harus mengirim FCM saat:
//   • Surat masuk baru
//   • Disposisi baru
//   • Approval diperlukan
//   • Agenda baru

// 2. Kategorisasi Notifikasi di Dashboard
// Buat widget notifikasi terkelompok:
// - 📩 Surat Masuk
// - 📝 Disposisi  
// - ✍️ Persetujuan
// - 📅 Agenda

// 3. Navigasi dari Notifikasi
// Update onMessageOpenedApp untuk routing:
if (data['type'] == 'surat_masuk') {
  // Navigate ke detail surat
} else if (data['type'] == 'disposisi') {
  // Navigate ke halaman disposisi
}
```

**Payload FCM dari Backend**:
```json
{
  "to": "FCM_TOKEN_USER",
  "notification": {
    "title": "Surat Masuk Baru",
    "body": "Surat dari PT XYZ perihal Kerjasama"
  },
  "data": {
    "type": "surat_masuk",
    "surat_id": "123",
    "priority": "high"
  }
}
```

---

### B. DISPOSISI PENUH 📝
**Status**: ⚠️ UI ada, perlu integrasi upload file

**Yang Perlu Ditambahkan**:
```dart
// 1. Upload File Pendukung
import 'package:image_picker/image_picker.dart';

Future<void> pickAndUploadAttachment() async {
  final picker = ImagePicker();
  final image = await picker.pickImage(
    source: ImageSource.camera, // atau gallery
    maxWidth: 1920,
    maxHeight: 1080,
    imageQuality: 85,
  );
  
  // Upload ke backend via Dio
  // Endpoint: POST /api/disposisi/{id}/attachment
}

// 2. Form Disposisi Lengkap
// - Pilih tujuan (dropdown dari API user/pegawai)
// - Catatan disposisi (textfield multi-line)
// - Upload attachment (opsional)
// - Submit disposisi
```

**Endpoint Backend yang Diperlukan**:
```
POST /api/surat/{id}/disposisi
Body: {
  "tujuan_id": "user_id",
  "catatan": "text",
  "attachment": "file" (multipart)
}
```

---

### C. PERSETUJUAN & DIGITAL SIGNATURE ✍️
**Status**: ⚠️ UI ada, perlu biometric auth

**Implementasi Biometric**:
```dart
import 'package:local_auth/local_auth.dart';

class DigitalSignatureService {
  final LocalAuthentication _auth = LocalAuthentication();
  
  Future<bool> authenticateUser() async {
    // Cek ketersediaan biometric
    final canCheckBiometrics = await _auth.canCheckBiometrics;
    final isDeviceSupported = await _auth.isDeviceSupported();
    
    if (!canCheckBiometrics || !isDeviceSupported) {
      // Fallback ke PIN
      return showPinDialog();
    }
    
    // Authenticasi dengan biometric
    try {
      final didAuthenticate = await _auth.authenticate(
        localizedReason: 'Verifikasi identitas untuk tanda tangan digital',
        options: const AuthenticationOptions(
          biometricOnly: false, // Izinkan PIN jika biometric gagal
          stickyAuth: true,
        ),
      );
      return didAuthenticate;
    } catch (e) {
      return showPinDialog();
    }
  }
  
  Future<void> signSurat(String suratId) async {
    final isAuthenticated = await authenticateUser();
    if (isAuthenticated) {
      // Call API approval
      await approveSurat(suratId);
      showSuccessModal();
    }
  }
}
```

**Flow Approval Berjenjang**:
```
1. User klik "Setujui" 
2. Muncul dialog biometric/PIN
3. Jika sukses → call API /api/surat/{id}/approve
4. Backend validasi dan update status
5. Tampilkan QR code verifikasi
```

---

### D. TRACKING SURAT VISUAL 📊
**Status**: ✅ Stepper ada, perlu enhancement

**Enhancement yang Disarankan**:
```dart
// 1. Timeline Vertikal Lebih Detail
// Tampilkan setiap step dengan:
// - Nama pejabat/unit
// - Tanggal & waktu
// - Status (proses/selesai)
// - Durasi (berapa lama di meja siapa)

// 2. Visualisasi Grafik
// Gunakan fl_chart untuk:
// - Pie chart: status surat (pending/proses/selesai)
// - Bar chart: jumlah surat per hari/minggu
// - Line chart: trend surat masuk vs keluar
```

**Data Tracking dari Backend**:
```json
{
  "tracking": [
    {
      "step": 1,
      "unit": "Bagian Umum",
      "action": "Verifikasi surat masuk",
      "timestamp": "2026-04-01 08:30:00",
      "status": "completed"
    },
    {
      "step": 2,
      "unit": "Manajer IT",
      "action": "Disposisi awal",
      "timestamp": "2026-04-01 10:15:00",
      "status": "completed"
    },
    {
      "step": 3,
      "unit": "Direktur Utama",
      "action": "Persetujuan akhir",
      "timestamp": null,
      "status": "pending"
    }
  ]
}
```

---

### E. DASHBOARD EKSEKUTIF 📈
**Status**: ⚠️ Ada statistik dasar, perlu widget khusus pimpinan

**Widget yang Harus Ditambahkan**:
```dart
// 1. Widget Summary Pimpinan
Row(
  children: [
    _buildExecutiveCard(
      icon: Icons.pending_actions,
      title: 'Pending Disposisi',
      count: pendingDisposisiCount,
      color: Colors.orange,
      onTap: () => navigateToDisposisi(),
    ),
    _buildExecutiveCard(
      icon: Icons.edit_note,
      title: 'Menunggu Tanda Tangan',
      count: pendingApprovalCount,
      color: Colors.red,
      onTap: () => navigateToApproval(),
    ),
  ],
)

// 2. Quick Actions
// - tombol cepat: Disposisi, Approval, Surat Masuk
// - recent activity list
```

---

### F. PDF VIEWER OPTIMIZED 📄
**Status**: ✅ Library sudah ada, perlu implementasi fitur

**Fitur yang Harus Diaktifkan**:
```dart
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class PdfViewerScreen extends StatefulWidget {
  final String pdfUrl;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Lihat Dokumen'),
        actions: [
          IconButton(
            icon: Icon(Icons.share),
            onPressed: () => sharePdf(),
          ),
          IconButton(
            icon: Icon(Icons.print),
            onPressed: () => printPdf(),
          ),
        ],
      ),
      body: SfPdfViewer.network(
        pdfUrl,
        onDocumentLoaded: (details) {
          // Simpan info jumlah halaman
        },
        onZoomChanged: (details) {
          // Handle zoom
        },
      ),
    );
  }
}
```

---

### G. INFORMASI DOWNLOAD LOG (AUDIT TRAIL) 📋
**Status**: ❌ Belum ada

**Implementasi**:
```dart
// Tambah di detail surat keluar
Widget _buildDownloadLog(List<DownloadLog> logs) {
  return Card(
    child: Column(
      children: [
        Text('Riwayat Download', style: headerStyle),
        ListView.builder(
          itemCount: logs.length,
          itemBuilder: (ctx, i) => ListTile(
            title: Text(logs[i].userName),
            subtitle: Text(logs[i].timestamp),
            leading: Icon(Icons.download),
          ),
        ),
      ],
    ),
  );
}
```

**API Endpoint**:
```
GET /api/surat-keluar/{id}/download-logs
Response: [
  {
    "user_name": "Budi Santoso",
    "user_email": "budi@ptabc.co.id",
    "downloaded_at": "2026-04-01 14:30:00"
  }
]
```

---

### H. AI EXECUTIVE SUMMARY 🤖
**Status**: ⚠️ Field ringkasan ada, perlu integrasi AI backend

**Display AI Summary**:
```dart
// Di detail surat, tampilkan box khusus AI summary
Container(
  decoration: BoxDecoration(
    color: Colors.blue.shade50,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: Colors.blue.shade200),
  ),
  padding: EdgeInsets.all(16),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(Icons.auto_awesome, color: Colors.blue),
          SizedBox(width: 8),
          Text('Ringkasan AI', style: boldText),
        ],
      ),
      SizedBox(height: 8),
      Text(aiSummary), // Dari backend
      SizedBox(height: 8),
      Wrap(
        spacing: 8,
        children: aiPoints.map((p) => 
          Chip(label: Text(p), backgroundColor: Colors.blue.shade100)
        ).toList(),
      ),
    ],
  ),
)
```

---

## 🔧 KONFIGURASI ANDROID

### 1. **AndroidManifest.xml**
Tambahkan permission di `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions for FCM -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <!-- Permissions for Biometric -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC"/>
    <uses-permission android:name="android.permission.USE_FINGERPRINT"/>
    
    <!-- Permissions for Camera/Image Picker -->
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    
    <!-- Permissions for Print -->
    <uses-permission android:name="android.permission.PRINT_SERVICE"/>
    
    <application ...>
        <!-- Firebase Messaging Service -->
        <service
            android:name="io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT"/>
            </intent-filter>
        </service>
        
        <!-- Default Notification Channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="e_office_channel"/>
            
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher"/>
    </application>
</manifest>
```

### 2. **google-services.json**
Pastikan file `android/app/google-services.json` sudah dikonfigurasi dengan Firebase project PT ABC.

---

## 🍎 KONFIGURASI iOS

### 1. **Info.plist**
Tambahkan di `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Aplikasi memerlukan akses kamera untuk upload lampiran disposisi</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Aplikasi memerlukan akses galeri untuk upload lampiran disposisi</string>

<key>NSFaceIDUsageDescription</key>
<string>Aplikasi memerlukan Face ID untuk verifikasi tanda tangan digital</string>

<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.flutter.background_fetch</string>
</array>
```

### 2. **Entitlements**
Di `ios/Runner/Runner.entitlements`:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:eoffice.ptabc.co.id</string>
</array>
```

---

## 🚀 LANGKAH SELANJUTNYA

### Prioritas 1 (Minggu 1-2):
1. ✅ Install dependencies baru: `flutter pub get`
2. ⚠️ Integrasikan FCM token dengan backend (simpan token user saat login)
3. ⚠️ Implementasi upload attachment disposisi
4. ⚠️ Implementasi biometric authentication

### Prioritas 2 (Minggu 3-4):
5. ⚠️ Dashboard eksekutif dengan widget khusus pimpinan
6. ⚠️ Tracking timeline visual yang lebih detail
7. ⚠️ Fitur download log (audit trail)
8. ⚠️ Integrasi AI summary dari backend

### Prioritas 3 (Minggu 5-6):
9. ⚠️ Testing end-to-end flow disposisi & approval
10. ⚠️ Optimasi performa PDF viewer
11. ⚠️ Penanganan error & edge cases
12. ⚠️ Dokumentasi user manual

---

## 📞 KOORDINASI DENGAN TIM BACKEND

**Endpoint yang Perlu Dikonfirmasi**:

| Fitur | Method | Endpoint | Status |
|-------|--------|----------|--------|
| Login + Save FCM Token | POST | `/api/auth/login` | ⚠️ Perlu update |
| Get Daftar Notifikasi | GET | `/api/notifikasi` | ❌ Perlu dibuat |
| Kirim Disposisi + Upload | POST | `/api/surat/{id}/disposisi` | ⚠️ Perlu multipart |
| Approval dengan Biometric | POST | `/api/surat/{id}/approve` | ⚠️ Perlu validasi |
| Tracking Detail | GET | `/api/surat/{id}/tracking` | ✅ Sudah ada? |
| Download Logs | GET | `/api/surat-keluar/{id}/downloads` | ❌ Perlu dibuat |
| AI Summary | GET | `/api/surat/{id}/ai-summary` | ⚠️ Perlu integrasi AI |

---

## 📌 CATATAN PENTING

1. **Jangan tambahkan efek UI berat** seperti glassmorphism, animasi berlebihan
2. **Fokus pada performa** - aplikasi harus cepat di HP spek menengah
3. **Hanya Bahasa Indonesia** - tidak perlu multi-language
4. **Mobile adalah alat kerja pimpinan** - prioritas pada disposisi, approval, tracking
5. **OCR & Scan adalah tugas backend** - mobile hanya upload foto biasa
6. **Backup & Log sistem adalah tugas backend** - tidak perlu di mobile

---

**Dibuat berdasarkan Proposal Teknis PT AKTIVITAS INSANI MADANI**
**Untuk Aplikasi E-Office PT ABC**
**Tanggal: April 2026**
