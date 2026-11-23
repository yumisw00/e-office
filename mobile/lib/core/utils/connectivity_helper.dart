import 'package:connectivity_plus/connectivity_plus.dart';

/// Helper untuk memantau status konektivitas jaringan.
/// Digunakan untuk menampilkan indikator offline saat tidak ada koneksi.
class ConnectivityHelper {
  ConnectivityHelper._();

  static final Connectivity _connectivity = Connectivity();
  static Stream<bool> get isConnectedStream =>
      _connectivity.onConnectivityChanged.map((results) {
        return !results.contains(ConnectivityResult.none);
      });

  static Future<bool> isConnected() async {
    final results = await _connectivity.checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }
}