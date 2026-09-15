import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';
import '../../core/network/dio_client.dart';

final suratRepositoryProvider = Provider<SuratRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ApiSuratRepository(dio);
});

/// Provider untuk daftar Surat Masuk
final suratMasukProvider = AsyncNotifierProvider<SuratMasukNotifier, List<SuratModel>>(() {
  return SuratMasukNotifier();
});

class SuratMasukNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getSuratMasuk(page: 1, pageSize: 20);
  }

  Future<void> fetchSuratMasuk() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getSuratMasuk(page: 1, pageSize: 20);
    });
  }

  Future<void> refresh() async {
    await fetchSuratMasuk();
  }
}

final suratSummaryProvider = AsyncNotifierProvider<SuratSummaryNotifier, SuratSummary>(() {
  return SuratSummaryNotifier();
});

class SuratSummaryNotifier extends AsyncNotifier<SuratSummary> {
  @override
  Future<SuratSummary> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getSuratMasukSummary();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getSuratMasukSummary();
    });
  }
}

final approvalQueueProvider = AsyncNotifierProvider<ApprovalQueueNotifier, List<SuratModel>>(() {
  return ApprovalQueueNotifier();
});

class ApprovalQueueNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getApprovalQueue();
  }

  Future<void> fetchApprovalQueue() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getApprovalQueue();
    });
  }

  Future<void> approveSurat(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.approveSuratKeluar(id);
    await fetchApprovalQueue();
  }

  Future<void> rejectSurat(String id, String notes) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.rejectSuratKeluar(id, notes);
    await fetchApprovalQueue();
  }

  Future<void> refresh() async {
    await fetchApprovalQueue();
  }
}

