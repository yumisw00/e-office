import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/app_config.dart';
part 'surat_provider.g.dart';
@riverpod
SuratRepository suratRepository(Ref ref) {
  final dio = ref.watch(dioProvider);
  return ApiSuratRepository(dio);
}
@riverpod
class SuratMasuk extends _$SuratMasuk {
  @override
  FutureOr<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getMyActions(page: 1, pagesize: 20);
  }
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(suratRepositoryProvider);
      final result = await repository.getMyActions(page: 1, pagesize: 20);
      state = AsyncValue.data(result);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  Future<void> loadMore(int page) async {
    final currentList = state.value;
    if (currentList == null) return;
    try {
      final repository = ref.read(suratRepositoryProvider);
      final newItems = await repository.getMyActions(page: page, pagesize: 20);
      final combined = [...currentList, ...newItems];
      state = AsyncValue.data(combined);
    } catch (e) {
      if (AppConfig.enableLogging) {
        debugPrint('Error loading more: $e');
      }
    }
  }
  Future<void> approveSurat(String id) async {
    final currentList = state.value;
    if (currentList == null) return;
    final updatedList = currentList.map((surat) {
      if (surat.id == id) {
        return surat.copyWith(status: 'selesai');
      }
      return surat;
    }).toList();
    state = AsyncValue.data(updatedList);
  }
  Future<void> disposisiSurat(String nomorSurat, String tujuan, String instruksi) async {
    final currentList = state.value;
    if (currentList == null) return;
    final updatedList = currentList.map((surat) {
      if (surat.nomorSurat == nomorSurat) {
        return surat.copyWith(status: 'DISPOSISI');
      }
      return surat;
    }).toList();
    state = AsyncValue.data(updatedList);
  }
}
