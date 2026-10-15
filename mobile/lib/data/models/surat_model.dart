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
