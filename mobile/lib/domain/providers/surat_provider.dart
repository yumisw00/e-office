import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';
import '../../core/network/dio_client.dart';

final suratRepositoryProvider = Provider<SuratRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ApiSuratRepository(dio);
});

/// DASHBOARD PIMPINAN
final pimpinanDashboardProvider = AsyncNotifierProvider<PimpinanDashboardNotifier, PimpinanDashboard>(() {
  return PimpinanDashboardNotifier();
});

class PimpinanDashboardNotifier extends AsyncNotifier<PimpinanDashboard> {
  @override
  Future<PimpinanDashboard> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getDashboard();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getDashboard();
    });
  }
}

/// DAFTAR TINDAKAN (MY ACTIONS)
final myActionsProvider = AsyncNotifierProvider<MyActionsNotifier, List<SuratModel>>(() {
  return MyActionsNotifier();
});

class MyActionsNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getMyActions();
  }

  Future<void> fetchMyActions() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getMyActions();
    });
  }

  Future<void> refresh() async {
    await fetchMyActions();
  }

  void removeActionOptimistically(String id) {
    state = state.whenData((list) => list.where((it) => it.id != id).toList());
  }

  Future<void> approveSurat(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.approveSurat(id);
    removeActionOptimistically(id);
  }

  Future<void> rejectSurat(String id, String reason) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.rejectSurat(id, reason);
    removeActionOptimistically(id);
  }

  Future<Map<String, dynamic>> signSurat(String id, String signatureData) async {
    final repository = ref.read(suratRepositoryProvider);
    final result = await repository.signSurat(id, signatureData: signatureData);
    await refresh();
    return result;
  }

  Future<void> completeDisposisi(
    String id,
    String catatan,
    String? fileBuktiPath, {
    String? idSuratMasuk,
    String? asalNilai,
  }) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.completeDisposisi(
      id,
      catatan: catatan,
      fileBuktiPath: fileBuktiPath,
      idSuratMasuk: idSuratMasuk,
      asalNilai: asalNilai,
    );
    await refresh();
  }

  Future<Map<String, dynamic>> uploadAttachment(String id, dynamic file) async {
    final repository = ref.read(suratRepositoryProvider);
    return await repository.uploadAttachment(id, file);
  }
}

/// TRACKING (Sesuai ID + ActionType)
final trackingProvider = FutureProvider.family<List<TimelineEvent>, ({String id, String? type})>((ref, arg) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getTracking(arg.id, arg.type);
});

/// DETAIL SURAT (Fetch by ID & ActionType)
final suratDetailProvider = FutureProvider.family<SuratModel?, ({String id, String? type})>((ref, arg) async {
  final repository = ref.watch(suratRepositoryProvider);
  if (arg.type == 'approval') {
    return await repository.getSuratKeluarDetail(arg.id);
  }
  if (arg.type == 'disposisi') {
    // Coba ambil melalui endpoint disposisi terlebih dahulu (GET /api/surat_disposisi/{id})
    final disp = await repository.getDisposisiDetail(arg.id);
    if (disp != null) return disp;
    // Fallback ke surat masuk jika arg.id merupakan idSuratMasuk
    return await repository.getSuratMasukDetail(arg.id);
  }
  return await repository.getSuratMasukDetail(arg.id);
});

/// NOTIFIKASI
final notificationProvider = AsyncNotifierProvider<NotificationNotifier, List<dynamic>>(() {
  return NotificationNotifier();
});

class NotificationNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getNotifications();
  }

  Future<void> loadNotifications({int page = 1, int perPage = 15}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getNotifications(page: page, perPage: perPage);
    });
  }

  Future<void> markRead(String id) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.markNotificationRead(id);
  }

  Future<void> markAllRead() async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.markAllNotificationsRead();
  }

  Future<void> refresh() async {
    await loadNotifications();
  }
}

/// MASTER JENIS SURAT (GET /api/surat_masuk/master-data)
final jenisSuratOptionsProvider = FutureProvider<List<Map<String, String>>>((ref) async {
  final repository = ref.watch(suratRepositoryProvider);
  try {
    return await repository.getJenisSuratOptions();
  } catch (_) {
    return [];
  }
});

/// CATEGORY SUMMARY (total, internal, eksternal) DARI API
final suratMasukCategorySummaryProvider = StateProvider<Map<String, int>?>((ref) => null);
final disposisiCategorySummaryProvider = StateProvider<Map<String, int>?>((ref) => null);

/// DAFTAR SURAT MASUK DEDIKASI (GET /api/surat_masuk)
final suratMasukListProvider = AsyncNotifierProvider<SuratMasukListNotifier, List<SuratModel>>(() {
  return SuratMasukListNotifier();
});

class SuratMasukListNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    final result = await repository.getSuratMasukList(pageSize: 100);
    if (repository is ApiSuratRepository && repository.lastSuratMasukCategorySummary != null) {
      ref.read(suratMasukCategorySummaryProvider.notifier).state =
          repository.lastSuratMasukCategorySummary;
    }
    return result;
  }

  Future<void> fetchSuratMasuk({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    String? tanggalTerima,
    int page = 1,
    int pageSize = 100,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      final result = await repository.getSuratMasukList(
        status: status,
        jenisPengiriman: jenisPengiriman,
        keyword: keyword,
        tanggalTerima: tanggalTerima,
        page: page,
        pageSize: pageSize,
      );
      if (repository is ApiSuratRepository && repository.lastSuratMasukCategorySummary != null) {
        ref.read(suratMasukCategorySummaryProvider.notifier).state =
            repository.lastSuratMasukCategorySummary;
      }
      return result;
    });
  }

  Future<void> refresh() async {
    await fetchSuratMasuk();
  }
}

/// DAFTAR APPROVAL DEDIKASI (GET /api/surat_approval)
final approvalListProvider = AsyncNotifierProvider<ApprovalListNotifier, List<SuratModel>>(() {
  return ApprovalListNotifier();
});

class ApprovalListNotifier extends AsyncNotifier<List<SuratModel>> {
  @override
  Future<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getApprovalList(pageSize: 100);
  }

  Future<void> fetchApprovalList({String? status, int page = 1, int pageSize = 100}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      return repository.getApprovalList(status: status, page: page, pageSize: pageSize);
    });
  }

  Future<void> refresh() async {
    await fetchApprovalList();
  }

  void removeApprovalOptimistically(String id) {
    state = state.whenData((list) => list.where((it) => it.id != id && it.idSuratApproval != id).toList());
  }

  Future<void> approveSurat(String id, {String? idSuratApproval}) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.approveSurat(id, idSuratApproval: idSuratApproval);
    removeApprovalOptimistically(id);
  }

  Future<void> rejectSurat(String id, String reason, {String? idSuratApproval}) async {
    final repository = ref.read(suratRepositoryProvider);
    await repository.rejectSurat(id, reason, idSuratApproval: idSuratApproval);
    removeApprovalOptimistically(id);
  }
}

// COMPATIBILITY PROVIDERS (Try to phase out)
final suratMasukProvider = myActionsProvider; // Alias
final suratSummaryProvider = Provider((ref) => ref.watch(pimpinanDashboardProvider)); // Alias

/// PENGUMUMAN
final pengumumanProvider = FutureProvider<List<PengumumanModel>>((ref) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getPengumuman(limit: 5);
});

/// AGENDA
final agendaProvider = FutureProvider<List<AgendaModel>>((ref) async {
  final repository = ref.watch(suratRepositoryProvider);
  return repository.getAgenda(limit: 5);
});

/// DAFTAR DISPOSISI
final disposisiListProvider = AsyncNotifierProvider<DisposisiListNotifier, List<Map<String, dynamic>>>(() {
  return DisposisiListNotifier();
});

class DisposisiListNotifier extends AsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    final result = await repository.getDisposisiList(pageSize: 100);
    if (repository is ApiSuratRepository && repository.lastDisposisiCategorySummary != null) {
      ref.read(disposisiCategorySummaryProvider.notifier).state =
          repository.lastDisposisiCategorySummary;
    }
    return result;
  }

  Future<void> fetchDisposisi({
    String? status,
    String? jenisPengiriman,
    String? keyword,
    int page = 1,
    int pageSize = 100,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(suratRepositoryProvider);
      final result = await repository.getDisposisiList(
        status: status,
        jenisPengiriman: jenisPengiriman,
        keyword: keyword,
        page: page,
        pageSize: pageSize,
      );
      if (repository is ApiSuratRepository && repository.lastDisposisiCategorySummary != null) {
        ref.read(disposisiCategorySummaryProvider.notifier).state =
            repository.lastDisposisiCategorySummary;
      }
      return result;
    });
  }

  Future<void> refresh() async {
    await fetchDisposisi();
  }
}
