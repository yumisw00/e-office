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

  Future<void> signSurat(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.signSuratKeluar(id);
    await repository.logAuditTrail('sign_surat', {'id_surat': id});
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

final disposisiListProvider = AsyncNotifierProvider<DisposisiListNotifier, List<dynamic>>(() {
  return DisposisiListNotifier();
});

class DisposisiListNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getDisposisiList();
  }

  Future<void> fetchDisposisi() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getDisposisiList();
    });
  }

  Future<void> refresh() async {
    await fetchDisposisi();
  }
}

final suratTimelineProvider = FutureProvider.family<List<TimelineEvent>, String>((ref, id) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getSuratMasukTimeline(id);
});

final notificationProvider = AsyncNotifierProvider<NotificationNotifier, List<dynamic>>(() {
  return NotificationNotifier();
});

class NotificationNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getNotifications();
    });
  }
}

