import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/surat_model.dart';
import '../../data/repositories/surat_repository.dart';

part 'surat_provider.g.dart';

@riverpod
SuratRepository suratRepository(Ref ref) {
  return MockSuratRepository();
}

@riverpod
class SuratMasuk extends _$SuratMasuk {
  @override
  FutureOr<List<SuratModel>> build() async {
    final repository = ref.watch(suratRepositoryProvider);
    return repository.getSuratMasuk();
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
