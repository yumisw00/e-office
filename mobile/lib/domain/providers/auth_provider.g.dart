part of 'auth_provider.dart';
@ProviderFor(AuthNotifier)
final authProvider = AuthNotifierProvider._();
final class AuthNotifierProvider
    extends $NotifierProvider<AuthNotifier, AsyncValue<bool>> {
  AuthNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );
  @override
  String debugGetCreateSourceHash() => _$authNotifierHash();
  @$internal
  @override
  AuthNotifier create() => AuthNotifier();
  Override overrideWithValue(AsyncValue<bool> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<bool>>(value),
    );
  }
}
String _$authNotifierHash() => r'730e20de8b58911114ade1fca52f22e6b79ee6a9';
abstract class _$AuthNotifier extends $Notifier<AsyncValue<bool>> {
  AsyncValue<bool> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<bool>, AsyncValue<bool>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<bool>, AsyncValue<bool>>,
              AsyncValue<bool>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
