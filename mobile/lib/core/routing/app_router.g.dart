part of 'app_router.dart';
@ProviderFor(appRouter)
final appRouterProvider = AppRouterProvider._();
final class AppRouterProvider
    extends $FunctionalProvider<GoRouter, GoRouter, GoRouter>
    with $Provider<GoRouter> {
  AppRouterProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'appRouterProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );
  @override
  String debugGetCreateSourceHash() => _$appRouterHash();
  @$internal
  @override
  $ProviderElement<GoRouter> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);
  @override
  GoRouter create(Ref ref) {
    return appRouter(ref);
  }
  Override overrideWithValue(GoRouter value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GoRouter>(value),
    );
  }
}
String _$appRouterHash() => r'0fa86841747489ae03ccaffb81121a3178f7ddc7';
