part of 'dio_client.dart';
@ProviderFor(dio)
final dioProvider = DioProvider._();
final class DioProvider extends $FunctionalProvider<Dio, Dio, Dio>
    with $Provider<Dio> {
  DioProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dioProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );
  @override
  String debugGetCreateSourceHash() => _$dioHash();
  @$internal
  @override
  $ProviderElement<Dio> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);
  @override
  Dio create(Ref ref) {
    return dio(ref);
  }
  Override overrideWithValue(Dio value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Dio>(value),
    );
  }
}
String _$dioHash() => r'e7a588112a00cb090cc9b565685b2adc7f0d6a8d';
