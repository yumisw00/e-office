// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'surat_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(suratRepository)
final suratRepositoryProvider = SuratRepositoryProvider._();

final class SuratRepositoryProvider
    extends
        $FunctionalProvider<SuratRepository, SuratRepository, SuratRepository>
    with $Provider<SuratRepository> {
  SuratRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'suratRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$suratRepositoryHash();

  @$internal
  @override
  $ProviderElement<SuratRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SuratRepository create(Ref ref) {
    return suratRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SuratRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SuratRepository>(value),
    );
  }
}

String _$suratRepositoryHash() => r'5c1993a24e4fbd26f0618c1e84177ac65b623cbc';

@ProviderFor(SuratMasuk)
final suratMasukProvider = SuratMasukProvider._();

final class SuratMasukProvider
    extends $AsyncNotifierProvider<SuratMasuk, List<SuratModel>> {
  SuratMasukProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'suratMasukProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$suratMasukHash();

  @$internal
  @override
  SuratMasuk create() => SuratMasuk();
}

String _$suratMasukHash() => r'daae2cbdb193f03eb21849f720f4fde8b396cd40';

abstract class _$SuratMasuk extends $AsyncNotifier<List<SuratModel>> {
  FutureOr<List<SuratModel>> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<List<SuratModel>>, List<SuratModel>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<SuratModel>>, List<SuratModel>>,
              AsyncValue<List<SuratModel>>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
