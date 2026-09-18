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
  });

  /// Mengambil path dokumen aktif sesuai kontrak:
  /// - Surat Keluar 'signed' -> signed_file_path (fallback draft_file_path)
  /// - Surat Keluar draft -> draft_file_path
  /// - Surat Masuk -> file_path
  /// - Disposisi -> attachments[0]['file_path'] jika ada
  String? get activeFilePath {
    if (status.toLowerCase() == 'signed' && signedFilePath != null && signedFilePath!.isNotEmpty) {
      return signedFilePath;
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
      status: _mapStatus(json['status'] ?? json['status_surat'] ?? 'belum_dibaca'),
      ringkasan: json['isi_ringkas'] ?? json['ringkasan'] ?? json['deskripsi'] ?? '',
      filePdf: rawFilePath,
      draftFilePath: rawDraftPath,
      signedFilePath: rawSignedPath,
      attachments: parsedAttachments,
      disposisiCount: json['disposisi_count'] ?? 0,
      pengirim: json['pengirim'] ?? json['nama_pengirim'],
      tanggalSurat: _parseDateOrNull(json['tanggal_surat']),
      pemohon: json['pemohon'] ?? json['nama_pemohon'] ?? json['diajukan_oleh'],
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
    if (status == null) return 'belum_dibaca';
    final statusStr = status.toString().toLowerCase();
    if (statusStr.contains('selesai') || statusStr.contains('arsip')) return 'selesai';
    if (statusStr.contains('disposisi')) return 'disposisi';
    if (statusStr.contains('baca')) return 'sudah_dibaca';
    if (statusStr.contains('baru')) return 'baru';
    return 'belum_dibaca';
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

  factory TimelineEvent.fromJsonApi(Map<String, dynamic> json) {
    return TimelineEvent(
      id: (json['id'] ?? '').toString(),
      judul: json['judul'] ?? json['aktivitas'] ?? json['kegiatan'] ?? 'Event',
      deskripsi: json['deskripsi'] ?? json['keterangan'] ?? '',
      tanggal: SuratModel._parseDate(json['tanggal'] ?? json['created_at'] ?? json['waktu']),
      pelaku: json['pelaku'] ?? json['user_name'] ?? json['nama_pelaku'] ?? 'Unknown',
      catatan: json['catatan'] ?? json['notes'],
      status: json['status'] ?? 'baru',
    );
  }
}

class SuratSummary {
  final int suratMasukCount;
  final int suratKeluarCount;
  final int disposisiPendingCount;
  final int agendaTodayCount;
  final String role;

  SuratSummary({
    required this.suratMasukCount,
    required this.suratKeluarCount,
    required this.disposisiPendingCount,
    required this.agendaTodayCount,
    required this.role,
  });

  factory SuratSummary.fromJsonApi(Map<String, dynamic> json) {
    return SuratSummary(
      suratMasukCount: json['surat_masuk_count'] ?? json['surat_masuk'] ?? 0,
      suratKeluarCount: json['surat_keluar_count'] ?? json['surat_keluar'] ?? 0,
      disposisiPendingCount: json['disposisi_pending_count'] ?? json['disposisi_pending'] ?? 0,
      agendaTodayCount: json['agenda_today_count'] ?? json['agenda_today'] ?? 0,
      role: json['role']?.toString() ?? '',
    );
  }

  factory SuratSummary.empty() {
    return SuratSummary(
      suratMasukCount: 0,
      suratKeluarCount: 0,
      disposisiPendingCount: 0,
      agendaTodayCount: 0,
      role: '',
    );
  }
}
