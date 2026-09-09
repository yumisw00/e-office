import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';
import 'package:flutter/foundation.dart';
import '../../core/constants/app_config.dart';
import '../../core/network/dio_client.dart';

part 'surat_provider.g.dart';

@riverpod
SuratRepository suratRepository(Ref ref) {
  // Use ApiSuratRepository for real API connection
  // Switch to MockSuratRepository for offline development/testing
  final dio = ref.watch(dioProvider);
  return ApiSuratRepository(dio);
  // return MockSuratRepository(); // Uncomment for mock data
}

@riverpod
class SuratMasuk extends _$SuratMasuk {
  @override
  FutureOr<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getSuratMasuk(page: 1, limit: 20);
  }

  /// Refresh surat masuk list from API
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    try {
      final repository = ref.read(suratRepositoryProvider);
      final result = await repository.getSuratMasuk(page: 1, limit: 20);
      state = AsyncValue.data(result);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Load more pages (pagination)
  Future<void> loadMore(int page) async {
    final currentList = state.value;
    if (currentList == null) return;

    try {
      final repository = ref.read(suratRepositoryProvider);
      final newItems = await repository.getSuratMasuk(page: page, limit: 20);
      
      // Combine with existing data
      final combined = [...currentList, ...newItems];
      state = AsyncValue.data(combined);
    } catch (e) {
      // Keep existing data on error
      if (AppConfig.enableLogging) {
        debugPrint('Error loading more: $e');
      }
    }
  }

  Future<void> approveSurat(String id) async {
    // Get the current state
    final currentList = state.value;
    if (currentList == null) return;

    // Update the list immutably
    final updatedList = currentList.map((surat) {
      if (surat.id == id) {
        return surat.copyWith(status: 'selesai');
      }
      return surat;
    }).toList();

    // Update the state
    state = AsyncValue.data(updatedList);
  }

  Future<void> disposisiSurat(String nomorSurat, String tujuan, String instruksi) async {
    // Get the current state
    final currentList = state.value;
    if (currentList == null) return;

    // Update the list immutably
    final updatedList = currentList.map((surat) {
      if (surat.nomorSurat == nomorSurat) {
        return surat.copyWith(status: 'DISPOSISI');
      }
      return surat;
    }).toList();

    // Update the state
    state = AsyncValue.data(updatedList);
  }
}
