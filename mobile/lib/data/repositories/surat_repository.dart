import '../models/surat_model.dart';

abstract class SuratRepository {
  Future<List<SuratModel>> getSuratMasuk();
}

class MockSuratRepository implements SuratRepository {
  @override
  Future<List<SuratModel>> getSuratMasuk() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    return [
      SuratModel(
        id: '1',
        nomorSurat: '001/ADM/VI/2024',
        asalSurat: 'PT. Maju Bersama',
        perihal: 'Permohonan Kerjasama Vendor',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 1)),
        status: 'belum_dibaca',
        ringkasan: 'Permohonan kerjasama penyediaan alat tulis kantor untuk periode semester kedua.',
      ),
      SuratModel(
        id: '2',
        nomorSurat: '045/SK/HRD/2024',
        asalSurat: 'Dinas Kepegawaian Pusat',
        perihal: 'Pemberitahuan Pelatihan Digital Government',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 2)),
        status: 'disposisi',
        ringkasan: 'Undangan pelatihan peningkatan kompetensi digital untuk staf administrasi.',
      ),
      SuratModel(
        id: '3',
        nomorSurat: '122/INV/FIN/2024',
        asalSurat: 'PLN Persero',
        perihal: 'Tagihan Listrik Gedung Pusat - Mei 2024',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 3)),
        status: 'selesai',
        ringkasan: 'Laporan tagihan bulanan penggunaan listrik operasional gedung utama.',
      ),
      SuratModel(
        id: '4',
        nomorSurat: '089/EXT/DIR/2024',
        asalSurat: 'Kementerian Keuangan',
        perihal: 'Koordinasi Anggaran Triwulan III',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 4)),
        status: 'disposisi',
        ringkasan: 'Rapat koordinasi teknis mengenai penyesuaian anggaran operasional triwulan ketiga.',
      ),
      SuratModel(
        id: '5',
        nomorSurat: '012/UND/VI/2024',
        asalSurat: 'Universitas Indonesia',
        perihal: 'Undangan Seminar Transformasi Digital',
        tanggalDiterima: DateTime.now().subtract(const Duration(hours: 5)),
        status: 'belum_dibaca',
        ringkasan: 'Undangan menjadi pembicara tamu dalam seminar nasional transformasi digital sektor publik.',
      ),
      SuratModel(
        id: '6',
        nomorSurat: '331/LEG/2024',
        asalSurat: 'Firma Hukum Adidarma',
        perihal: 'Pembaruan Kontrak Sewa Lahan',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 6)),
        status: 'selesai',
        ringkasan: 'Dokumen finalisasi perpanjangan kontrak sewa lahan parkir sisi timur gedung.',
      ),
      SuratModel(
        id: '7',
        nomorSurat: '119/SKR/2024',
        asalSurat: 'Politeknik Negeri Madiun',
        perihal: 'Pembaruan Kontrak Sewa Server',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 7)),
        status: 'belum_dibaca',
        ringkasan: 'Dokumen rincian biaya seva server cloud dari langganan google cloud.',
      ),
      SuratModel(
        id: '8',
        nomorSurat: '119/SKR/2024',
        asalSurat: 'Politeknik Negeri Madiun',
        perihal: 'Pembaruan Kontrak Sewa Server',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 7)),
        status: 'belum_dibaca',
        ringkasan: 'Dokumen rincian biaya seva server cloud dari langganan google cloud.',
      ),
    ];
  }
}
