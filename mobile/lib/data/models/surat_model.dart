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
  final String? jenisSurat;
  final String? jenisPengiriman;
  final String? googleDriveUrl;
  final bool sudahDiarsipkan;
  final String? nomorAgenda;
  final String? penerima;
  final String? sifat;
  final String? catatan;

  // FINAL CONTRACT - Pimpinan App
  final String? actionType; // "disposisi" atau "approval" atau "surat_masuk"
  final String? idDisposisi;
  final String? idSuratApproval;
  final String? idSuratKeluar;

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
    this.jenisSurat,
    this.jenisPengiriman,
    this.googleDriveUrl,
    this.sudahDiarsipkan = false,
    this.nomorAgenda,
    this.penerima,
    this.sifat,
    this.catatan,
    this.actionType,
    this.idDisposisi,
    this.idSuratApproval,
    this.idSuratKeluar,
  });

  /// Cek apakah suatu URL mengarah ke Google Docs / Drive
  static bool isGoogleDocsOrDriveUrl(String? url) {
    if (url == null || url.isEmpty) return false;
    return RegExp(
      r'(^https?:\/\/)?(docs|drive)\.google\.com\/',
      caseSensitive: false,
    ).hasMatch(url);
  }

  /// Apakah dokumen utama surat ini adalah Google Docs
  bool get isGoogleDocs =>
      isGoogleDocsOrDriveUrl(activeFilePath) ||
      isGoogleDocsOrDriveUrl(googleDriveUrl);

  /// Mengambil path dokumen aktif sesuai kontrak:
  /// - Surat Keluar 'signed' -> signed_file_path (fallback draft_file_path)
  /// - Surat Keluar draft -> draft_file_path
  /// - Surat Masuk -> file_path
  /// - Disposisi -> attachments[0]['file_path'] jika ada
  /// - Dokumen Google Docs / Drive
  String? get activeFilePath {
    if (googleDriveUrl != null && googleDriveUrl!.isNotEmpty) {
      return googleDriveUrl;
    }
    if (status.toLowerCase() == 'signed' || status.toLowerCase() == 'dikirim') {
      if (signedFilePath != null && signedFilePath!.isNotEmpty)
        return signedFilePath;
    }
    if (filePdf != null && filePdf!.isNotEmpty) {
      return filePdf;
    }
    if (draftFilePath != null && draftFilePath!.isNotEmpty) {
      return draftFilePath;
    }
    if (attachments.isNotEmpty) {
      final first = attachments.first;
      if (first is Map && first['file_path'] != null) {
        return first['file_path'].toString();
      }
      if (first is Map && first['url'] != null) {
        return first['url'].toString();
      }
      if (first is String && first.isNotEmpty) {
        return first;
      }
    }
    return null;
  }

  factory SuratModel.fromJsonApi(Map<String, dynamic> json) {
    // Dukung payload bersarang dari respons disposisi (surat_masuk / suratMasuk)
    final nestedSurat = json['surat_masuk'] is Map
        ? json['surat_masuk'] as Map<String, dynamic>
        : (json['suratMasuk'] is Map
              ? json['suratMasuk'] as Map<String, dynamic>
              : null);

    List<dynamic> parsedAttachments = [];
    if (json['attachments'] != null && json['attachments'] is List) {
      parsedAttachments = json['attachments'] as List;
    } else if (nestedSurat != null && nestedSurat['attachments'] is List) {
      parsedAttachments = nestedSurat['attachments'] as List;
    }

    final rawDraftPath =
        json['draft_file_path'] ??
        json['file_draft_path'] ??
        nestedSurat?['draft_file_path'] ??
        nestedSurat?['file_draft_path'];
    final rawSignedPath =
        json['signed_file_path'] ?? nestedSurat?['signed_file_path'];
    final rawFilePath =
        json['file_pdf_path'] ??
        json['file_path'] ??
        json['file_surat'] ??
        json['lampiran_path'] ??
        json['lampiran'] ??
        nestedSurat?['file_pdf_path'] ??
        nestedSurat?['file_path'] ??
        nestedSurat?['file_surat'] ??
        nestedSurat?['lampiran_path'] ??
        nestedSurat?['lampiran'];

    final rawGoogleDriveUrl =
        json['google_drive_document_url']?.toString() ??
        json['drive_document_url']?.toString() ??
        json['google_drive_url']?.toString() ??
        json['template_google_drive_url']?.toString() ??
        nestedSurat?['google_drive_document_url']?.toString() ??
        nestedSurat?['drive_document_url']?.toString() ??
        nestedSurat?['google_drive_url']?.toString() ??
        nestedSurat?['template_google_drive_url']?.toString();

    final effectiveGoogleDriveUrl =
        (rawGoogleDriveUrl != null && rawGoogleDriveUrl.isNotEmpty)
        ? rawGoogleDriveUrl
        : (isGoogleDocsOrDriveUrl(rawFilePath?.toString())
              ? rawFilePath?.toString()
              : null);

    final idKeluar =
        json['id_surat_keluar']?.toString() ??
        nestedSurat?['id_surat_keluar']?.toString();
    final idMasuk =
        json['id_surat_masuk']?.toString() ??
        nestedSurat?['id_surat_masuk']?.toString() ??
        nestedSurat?['id']?.toString();
    final idAppr = json['id_surat_approval']?.toString();
    final idDisp =
        (json['id_surat_disposisi'] ??
                json['id_disposisi'] ??
                (nestedSurat != null ? json['id'] : null))
            ?.toString();
    final generalId = json['id']?.toString() ?? json['uuid']?.toString();

    String finalId;
    if (json.containsKey('id_surat_approval') ||
        json['action_type'] == 'approval') {
      finalId = idKeluar ?? generalId ?? idAppr ?? '';
    } else if (idDisp != null &&
        idDisp.isNotEmpty &&
        (json.containsKey('instruksi') || json['action_type'] == 'disposisi')) {
      finalId = idDisp;
    } else if (idMasuk != null && idMasuk.isNotEmpty) {
      finalId = idMasuk;
    } else {
      finalId = generalId ?? idKeluar ?? idAppr ?? '';
    }

    final mappedStatus = _mapStatus(
      json['status'] ??
          json['status_surat'] ??
          nestedSurat?['status'] ??
          'baru',
    );
    final rawArchived =
        json['sudah_diarsipkan'] ?? nestedSurat?['sudah_diarsipkan'];
    final isArchived =
        rawArchived == true ||
        rawArchived == 1 ||
        rawArchived?.toString().toLowerCase() == 'true' ||
        mappedStatus == 'diarsipkan' ||
        mappedStatus == 'arsip';

    final penerimaUser = json['penerima_user'] is Map
        ? json['penerima_user'] as Map
        : (nestedSurat?['penerima_user'] is Map
              ? nestedSurat!['penerima_user'] as Map
              : null);
    final parsedPenerima =
        penerimaUser?['name']?.toString() ??
        (json['penerima'] ??
                json['kepada_tujuan'] ??
                nestedSurat?['penerima'] ??
                nestedSurat?['kepada_tujuan'])
            ?.toString();

    final rawJenisPengiriman =
        (json['jenis_pengiriman'] ?? nestedSurat?['jenis_pengiriman'])
            ?.toString()
            .trim()
            .toLowerCase();
    final parsedJenisPengiriman =
        (rawJenisPengiriman == 'internal' || rawJenisPengiriman == 'eksternal')
        ? rawJenisPengiriman
        : (idKeluar != null && idKeluar.isNotEmpty ? 'internal' : 'eksternal');

    return SuratModel(
      id: finalId,
      nomorSurat:
          json['nomor_surat'] ??
          nestedSurat?['nomor_surat'] ??
          json['nomor_agenda'] ??
          nestedSurat?['nomor_agenda'] ??
          json['kode_draft'] ??
          '-',
      asalSurat:
          json['asal_surat'] ??
          nestedSurat?['asal_surat'] ??
          json['nama_pemberi'] ??
          json['pengirim'] ??
          nestedSurat?['pengirim'] ??
          json['instansi_pengirim'] ??
          json['created_by_name'] ??
          json['pembuat'] ??
          '-',
      perihal:
          json['perihal'] ??
          nestedSurat?['perihal'] ??
          json['isi_ringkas'] ??
          json['instruksi'] ??
          '-',
      tanggalDiterima: _parseDate(
        json['tanggal_diajukan'] ??
            json['tanggal_terima'] ??
            json['tanggal_diterima'] ??
            json['tanggal_disposisi'] ??
            nestedSurat?['tanggal_terima'] ??
            nestedSurat?['tanggal_diterima'] ??
            json['created_at'] ??
            DateTime.now(),
      ),
      status: mappedStatus,
      ringkasan:
          (json['isi_ringkasan'] ??
                  nestedSurat?['isi_ringkasan'] ??
                  json['isi_ringkas'] ??
                  nestedSurat?['isi_ringkas'] ??
                  json['ringkasan'] ??
                  nestedSurat?['ringkasan'] ??
                  json['deskripsi'] ??
                  json['instruksi'] ??
                  json['catatan'] ??
                  '')
              .toString(),
      filePdf: rawFilePath,
      draftFilePath: rawDraftPath,
      signedFilePath: rawSignedPath,
      attachments: parsedAttachments,
      disposisiCount: json['disposisi_count'] ?? 0,
      pengirim:
          json['pengirim'] ??
          nestedSurat?['pengirim'] ??
          json['nama_pengirim'] ??
          json['tujuan_nama'],
      tanggalSurat: _parseDateOrNull(
        json['tanggal_surat'] ??
            nestedSurat?['tanggal_surat'] ??
            json['tanggal_diajukan'],
      ),
      pemohon:
          json['pemohon'] ??
          nestedSurat?['pemohon'] ??
          json['nama_pemohon'] ??
          json['dia_jukan_oleh'] ??
          json['created_by_name'],
      jenisSurat:
          json['nama_jenis_surat'] ??
          (json['jenis_surat'] is Map
              ? json['jenis_surat']['nama']
              : json['jenis_surat']) ??
          nestedSurat?['jenis'] ??
          json['jenis'],
      jenisPengiriman: parsedJenisPengiriman,
      googleDriveUrl: effectiveGoogleDriveUrl,
      sudahDiarsipkan: isArchived,
      nomorAgenda: (json['nomor_agenda'] ?? nestedSurat?['nomor_agenda'])
          ?.toString(),
      penerima: parsedPenerima,
      sifat: (json['sifat'] ?? nestedSurat?['sifat'])?.toString(),
      catatan: (json['catatan'] ?? nestedSurat?['catatan'])?.toString(),
      actionType: json['action_type']?.toString(),
      idDisposisi: idDisp,
      idSuratApproval: idAppr,
      idSuratKeluar: idKeluar,
    );
  }

  static DateTime _parseDate(dynamic dateValue) {
    if (dateValue is DateTime) return dateValue;
    if (dateValue is int)
      return DateTime.fromMillisecondsSinceEpoch(dateValue * 1000);
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
    if (dateValue is int)
      return DateTime.fromMillisecondsSinceEpoch(dateValue * 1000);
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
      if (jenisPengiriman != null) 'jenis_pengiriman': jenisPengiriman,
      if (googleDriveUrl != null) 'google_drive_document_url': googleDriveUrl,
      if (disposisiCount > 0) 'disposisi_count': disposisiCount,
      if (actionType != null) 'action_type': actionType,
      if (idDisposisi != null) 'id_disposisi': idDisposisi,
      if (idSuratApproval != null) 'id_surat_approval': idSuratApproval,
      if (idSuratKeluar != null) 'id_surat_keluar': idSuratKeluar,
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
    String? draftFilePath,
    String? signedFilePath,
    List<dynamic>? attachments,
    String? googleDriveUrl,
    int? disposisiCount,
    String? pengirim,
    DateTime? tanggalSurat,
    String? pemohon,
    String? jenisSurat,
    String? jenisPengiriman,
    bool? sudahDiarsipkan,
    String? nomorAgenda,
    String? penerima,
    String? sifat,
    String? catatan,
    String? actionType,
    String? idDisposisi,
    String? idSuratApproval,
    String? idSuratKeluar,
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
      draftFilePath: draftFilePath ?? this.draftFilePath,
      signedFilePath: signedFilePath ?? this.signedFilePath,
      attachments: attachments ?? this.attachments,
      googleDriveUrl: googleDriveUrl ?? this.googleDriveUrl,
      disposisiCount: disposisiCount ?? this.disposisiCount,
      pengirim: pengirim ?? this.pengirim,
      tanggalSurat: tanggalSurat ?? this.tanggalSurat,
      pemohon: pemohon ?? this.pemohon,
      jenisSurat: jenisSurat ?? this.jenisSurat,
      jenisPengiriman: jenisPengiriman ?? this.jenisPengiriman,
      sudahDiarsipkan: sudahDiarsipkan ?? this.sudahDiarsipkan,
      nomorAgenda: nomorAgenda ?? this.nomorAgenda,
      penerima: penerima ?? this.penerima,
      sifat: sifat ?? this.sifat,
      catatan: catatan ?? this.catatan,
      actionType: actionType ?? this.actionType,
      idDisposisi: idDisposisi ?? this.idDisposisi,
      idSuratApproval: idSuratApproval ?? this.idSuratApproval,
      idSuratKeluar: idSuratKeluar ?? this.idSuratKeluar,
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
  /// Kontrak backend /surat_disposisi/{id}/timeline:
  /// {"type":"created","title":"Disposisi dibuat","description":"...","status":"open","created_at":"..."}
  /// - judul     = title
  /// - deskripsi = status (ditampilkan sebagai badge kecil)
  /// - tanggal   = created_at
  /// - pelaku    = kosong (backend tidak mengirim)
  /// - catatan   = description (dari disposisi timeline)
  factory TimelineEvent.fromJsonApi(Map<String, dynamic> json) {
    final statusStr = (json['status'] ?? '').toString();
    return TimelineEvent(
      id: (json['id'] ?? json['id_surat_disposisi'] ?? json['type'] ?? '')
          .toString(),
      judul: (json['title'] ?? json['judul'] ?? 'Event').toString(),
      deskripsi: statusStr,
      tanggal: SuratModel._parseDate(json['created_at']),
      pelaku: (json['performed_by'] ?? json['pelaku'] ?? '').toString(),
      catatan: (json['description'] ?? json['catatan'])?.toString(),
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
      tanggal: SuratModel._parseDateOrNull(
        json['tanggal'] ?? json['created_at'],
      ),
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
      tanggalMulai: SuratModel._parseDateOrNull(
        json['tanggal_mulai'] ?? json['created_at'],
      ),
    );
  }
}
