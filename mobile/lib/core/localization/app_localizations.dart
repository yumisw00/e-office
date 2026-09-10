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
      'dashboard': 'Dashboard',
      'surat_masuk': 'Surat Masuk',
      'persetujuan': 'Persetujuan',
      'profile': 'Profil',
      'login': 'Masuk',
      'logout': 'Keluar',
      'email': 'Email',
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
      ' Batal': 'Batal',
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
