class UserModel {
  final String id;
  final String nama;
  final String email;
  final String? nip;
  final String? jabatan;
  final String? unitKerja;
  final List<String> groups;
  final String? fotoProfil;
  UserModel({
    required this.id,
    required this.nama,
    required this.email,
    this.nip,
    this.jabatan,
    this.unitKerja,
    this.groups = const [],
    this.fotoProfil,
  });
  factory UserModel.fromJsonApi(Map<String, dynamic> json) {
    final groupData = json['group'] as Map<String, dynamic>?;
    final jabatanDariGroup = groupData?['nama_jabatan']?.toString();
    final unitDariGroup = groupData?['nama_unit']?.toString() ?? groupData?['nama']?.toString();
    final namaValue = json['nama'] ?? json['name'] ?? json['full_name'];
    final jabatanValue = json['jabatan'] ?? json['position'] ?? json['role_name'] ?? jabatanDariGroup;
    final unitKerjaValue = json['unit_kerja'] ?? json['department'] ?? json['divisi'] ?? unitDariGroup;
    return UserModel(
      id: (json['id_user'] ?? json['id'] ?? json['uuid'] ?? '').toString(),
      nama: namaValue.toString() ?? 'User',
      email: json['email']?.toString() ?? '',
      nip: json['nip']?.toString(),
      jabatan: jabatanValue.toString(),
      unitKerja: unitKerjaValue?.toString(),
      groups: _parseGroups(json['groups'] ?? json['roles'] ?? []),
      fotoProfil: json['foto_profil'] ?? json['avatar'] ?? json['profile_picture'],
    );
  }
  static List<String> _parseGroups(dynamic groupsData) {
    if (groupsData == null) return [];
    if (groupsData is List) {
      return groupsData
          .map((g) => g is Map ? g['name']?.toString() : g.toString())
          .where((g) => g != null && g.isNotEmpty)
          .cast<String>()
          .toList();
    }
    if (groupsData is Map) {
      if (groupsData.containsKey('data')) {
        return _parseGroups(groupsData['data']);
      }
      if (groupsData.containsKey('name')) {
        return [groupsData['name'].toString()];
      }
    }
    return [];
  }
  bool hasGroup(String groupName) {
    return groups.any((g) => g.toLowerCase() == groupName.toLowerCase());
  }
  bool get isPimpinan {
    return groups.any((g) => 
      g.toLowerCase().contains('pimpinan') ||
      g.toLowerCase().contains('direksi') ||
      g.toLowerCase().contains('manager') ||
      g.toLowerCase().contains('kadiv') ||
      g.toLowerCase().contains('kabag')
    );
  }
  bool get isAdmin {
    return groups.any((g) => 
      g.toLowerCase().contains('admin') ||
      g.toLowerCase().contains('super')
    );
  }
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      nama: json['nama'] as String,
      email: json['email'] as String,
      nip: json['nip'] as String?,
      jabatan: json['jabatan'] as String?,
      unitKerja: json['unit_kerja'] as String?,
      groups: (json['groups'] as List?)?.cast<String>() ?? [],
      fotoProfil: json['foto_profil'] as String?,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'email': email,
      'nip': nip,
      'jabatan': jabatan,
      'unit_kerja': unitKerja,
      'groups': groups,
      'foto_profil': fotoProfil,
    };
  }
  UserModel copyWith({
    String? id,
    String? nama,
    String? email,
    String? nip,
    String? jabatan,
    String? unitKerja,
    List<String>? groups,
    String? fotoProfil,
  }) {
    return UserModel(
      id: id ?? this.id,
      nama: nama ?? this.nama,
      email: email ?? this.email,
      nip: nip ?? this.nip,
      jabatan: jabatan ?? this.jabatan,
      unitKerja: unitKerja ?? this.unitKerja,
      groups: groups ?? this.groups,
      fotoProfil: fotoProfil ?? this.fotoProfil,
    );
  }
  @override
  String toString() {
    return 'UserModel(id: $id, nama: $nama, email: $email, jabatan: $jabatan)';
  }
}
