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
