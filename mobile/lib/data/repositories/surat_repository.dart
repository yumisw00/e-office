import 'package:dio/dio.dart';
import '../models/surat_model.dart';
import '../../core/constants/app_config.dart';
abstract class SuratRepository {
  Future<List<SuratModel>> getMyActions({int page = 1, int pagesize = 20});
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20});
  Future<SuratModel?> getSuratDetail(String id);
}
class ApiSuratRepository implements SuratRepository {
  final Dio _dio;
  ApiSuratRepository(this._dio);
  @override
  Future<List<SuratModel>> getMyActions({int page = 1, int pagesize = 20}) async {
    try {
      final response = await _dio.get(
        '/pimpinan/my-actions',
        queryParameters: {
          'page': page,
          'pagesize': pagesize,
        },
      );
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> suratList;
        if (data is Map && data.containsKey('data')) {
          suratList = data['data'] as List;
        } else if (data is List) {
          suratList = data;
        } else {
          suratList = [];
        }
        return suratList
            .map((json) => SuratModel.fromJsonApi(json))
            .toList();
      }
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting my-actions: ${e.message}');
      }
      if (e.response?.statusCode == 403) {
        print(' Error 403: User bukan Pimpinan dan tidak memiliki akses');
        return [];
      }
      rethrow;
    }
  }
  @override
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/surat_keluar',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> suratList;
        if (data is Map && data.containsKey('data')) {
          suratList = data['data'] as List;
        } else if (data is List) {
          suratList = data;
        } else {
          suratList = [];
        }
        return suratList
            .map((json) => SuratModel.fromJsonApi(json))
            .toList();
      }
      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        type: DioExceptionType.badResponse,
      );
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting surat keluar: ${e.message}');
      }
      rethrow;
    }
  }
  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    try {
      final response = await _dio.get('/surat_masuk/$id');
      if (response.statusCode == 200) {
        final data = response.data;
        if (data != null) {
          return SuratModel.fromJsonApi(data);
        }
      }
      return null;
    } on DioException catch (e) {
      if (AppConfig.enableLogging) {
        print(' Error getting surat detail: ${e.message}');
      }
      rethrow;
    }
  }
}
class MockSuratRepository implements SuratRepository {
  @override
  Future<List<SuratModel>> getMyActions({int page = 1, int pagrsize = 20}) async {
    await Future.delayed(const Duration(seconds: 1));
    return [
      SuratModel(
        idSurat: '1',
        nomorSurat: '001/ADM/VI/2024',
        asalSurat: 'PT. Maju Bersama',
        perihal: 'Permohonan Kerjasama Vendor',
        tanggalSurat: DateTime.now().subtract(const Duration(days: 1)),
        status: 'belum_dibaca',
      ),
      SuratModel(
        idSurat: '2',
        nomorSurat: '045/SK/HRD/2024',
        asalSurat: 'Dinas Kepegawaian Pusat',
        perihal: 'Pemberitahuan Pelatihan Digital Government',
        tanggalDiterima: DateTime.now().subtract(const Duration(days: 2)),
        status: 'disposisi',
      ),
    ];
  }
  @override
  Future<List<SuratModel>> getSuratKeluar({int page = 1, int limit = 20}) async {
    await Future.delayed(const Duration(seconds: 1));
    return [];
  }
  @override
  Future<SuratModel?> getSuratDetail(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return null;
  }
}
