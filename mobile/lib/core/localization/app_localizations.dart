import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('en'));
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // General
      'title': 'E-Office Dahana',
      'app_bar_title': 'E-Office Dashboard',
      'system': 'System',
      'light': 'Light',
      'dark': 'Dark',
      'english': 'English',
      'indonesia': 'Indonesian',
      'logout': 'Logout',
      'logout_confirm': 'Are you sure you want to logout?',
      'cancel': 'Cancel',
      'ok': 'OK',
      'close': 'Close',
      'retry': 'Retry',
      'error_loading': 'Failed to load data',
      'search': 'Search...',
      'no_data': 'No letters found.',
      'select_language': 'Select Language',
      'select_theme': 'Select Theme',

      // Auth
      'login_title': 'Login E-Office Dahana',
      'email': 'Email',
      'password': 'Password',
      'not_robot': 'I am not a robot (Verification)',
      'login_button': 'Log In',
      'login_failed': 'Login Failed',
      'forgot_password': 'Forgot Password?',
      'captcha_error': 'Please verify that you are not a robot first.',

      // Nav Bar / Tabs
      'dashboard': 'Dashboard',
      'surat_masuk': 'Incoming',
      'surat_keluar': 'Outgoing',
      'profile': 'Profile',

      // Dashboard Screen
      'welcome': 'Welcome back,',
      'statistics': 'Summary Statistics',
      'total_inbox': 'Total Incoming',
      'total_sent': 'Total Outgoing',
      'need_action': 'Need Review',
      'recent_letters': 'Recent Letters',
      'analytics': 'Analytics',

      // Surat List / Details
      'letter_no': 'Letter Number',
      'sender': 'Sender',
      'receiver': 'Recipient',
      'subject': 'Subject',
      'received_date': 'Received Date',
      'sent_date': 'Sent Date',
      'status': 'Status',
      'summary': 'Summary',
      'unread': 'Unread',
      'disposition': 'Disposition',
      'completed': 'Completed',
      'view_document': 'View Document',
      'approve': 'Approve',
      'disposisi_btn': 'Disperse / Forward',
      'approve_digital_success': 'Digital Approval Successful',
      'approve_digital_desc': 'The letter has been successfully signed digitally.',
      'disposisi_instruction': 'Disposition Instruction',
      'disposisi_destination': 'Disposition Destination',
      'disposisi_notes': 'Instruction Notes',
      'disposisi_send': 'Send Disposition',

      // Profile Screen
      'user_profile': 'User Profile',
      'job_title': 'Job Title',
      'account_settings': 'Account Settings',
      'theme': 'Theme',
      'language': 'Language',
    },
    'id': {
      // General
      'title': 'E-Office Dahana',
      'app_bar_title': 'Dashboard E-Office',
      'system': 'Sistem',
      'light': 'Terang',
      'dark': 'Gelap',
      'english': 'Inggris',
      'indonesia': 'Bahasa Indonesia',
      'logout': 'Keluar (Logout)',
      'logout_confirm': 'Apakah Anda yakin ingin keluar?',
      'cancel': 'Batal',
      'ok': 'OK',
      'close': 'Tutup',
      'retry': 'Coba Lagi',
      'error_loading': 'Gagal memuat data',
      'search': 'Cari...',
      'no_data': 'Tidak ada data surat.',

      // Auth
      'login_title': 'Login E-Office Dahana',
      'email': 'Email',
      'password': 'Password',
      'not_robot': 'Saya bukan robot (Verification)',
      'login_button': 'Masuk',
      'login_failed': 'Login Gagal',
      'forgot_password': 'Lupa Password?',
      'captcha_error': 'Silakan verifikasi Captcha terlebih dahulu.',

      // Nav Bar / Tabs
      'dashboard': 'Dashboard',
      'surat_masuk': 'Surat Masuk',
      'surat_keluar': 'Surat Keluar',
      'profile': 'Profil',

      // Dashboard Screen
      'welcome': 'Selamat datang,',
      'statistics': 'Statistik Ringkasan',
      'total_inbox': 'Surat Masuk',
      'total_sent': 'Surat Keluar',
      'need_action': 'Butuh Tindakan',
      'recent_letters': 'Surat Terbaru',
      'analytics': 'Analisis',

      // Surat List / Details
      'letter_no': 'Nomor Surat',
      'sender': 'Asal Surat',
      'receiver': 'Tujuan Surat',
      'subject': 'Perihal',
      'received_date': 'Tanggal Diterima',
      'sent_date': 'Tanggal Dikirim',
      'status': 'Status',
      'summary': 'Ringkasan',
      'unread': 'Belum Dibaca',
      'disposition': 'Disposisi',
      'completed': 'Selesai',
      'view_document': 'Lihat Dokumen',
      'approve': 'Setujui',
      'disposisi_btn': 'Disposisi',
      'approve_digital_success': 'Persetujuan Digital Berhasil',
      'approve_digital_desc': 'Surat telah berhasil ditandatangani secara digital.',
      'disposisi_instruction': 'Instruksi Disposisi',
      'disposisi_destination': 'Tujuan Disposisi',
      'disposisi_notes': 'Catatan Instruksi',
      'disposisi_send': 'Kirim Disposisi',

      // Profile Screen
      'user_profile': 'Profil Pengguna',
      'job_title': 'Jabatan',
      'account_settings': 'Pengaturan Akun',
      'theme': 'Tema',
      'language': 'Bahasa',
      'select_language': 'Pilih Bahasa',
      'select_theme': 'Pilih Tema',
    },
  };

  String get(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'id'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}
