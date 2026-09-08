# E-Office Mobile Application

Aplikasi mobile untuk sistem manajemen surat dan dokumen elektronik (E-Office).

## Deskripsi

E-Office Mobile adalah aplikasi mobile yang memungkinkan pengguna untuk mengelola surat masuk, surat keluar, disposisi, dan arsip surat secara mobile. Aplikasi ini terintegrasi dengan backend API Laravel yang ada.

## Fitur Utama

- **Surat Masuk**: Melihat dan mengelola daftar surat yang masuk
- **Surat Keluar**: Membuat dan melacak surat yang dikirim
- **Disposisi**: Mendistribusikan surat kepada pihak yang dituju
- **Arsip Surat**: Menyimpan dan mencari surat arsip
- **Backup Database**: Backup dan restore data
- **Timeline**: Melihat timeline/riwayat pemrosesan surat

## Stack Teknologi

Pilih salah satu:

### React Native
```
Framework: React Native
Build Tool: Expo / Bare Workflow
State Management: Redux / Context API
Navigation: React Navigation
HTTP Client: Axios
```

### Flutter
```
Language: Dart
Framework: Flutter
State Management: Provider / Riverpod / GetX
Navigation: Get / GoRouter
HTTP Client: Dio / Http
```

### NativeScript
```
Framework: NativeScript
Language: TypeScript / JavaScript
UI Framework: NativeScript UI
Navigation: NativeScript Navigation
HTTP Client: Http Module
```

## Prasyarat

- Node.js v14+ (untuk React Native / Expo)
- Dart SDK v2.12+ (untuk Flutter)
- Android SDK / Xcode (untuk development)
- Backend API running di: `http://localhost:8000`

## Instalasi

### Setup dengan React Native (Expo)

```bash
# Install Expo CLI
npm install -g expo-cli

# Create project
expo init e-office-mobile
cd e-office-mobile

# Install dependencies
npm install

# Run development server
npm start
```

### Setup dengan Flutter

```bash
# Clone repository
git clone https://github.com/exacta-id/e-office.git
cd e-office/mobile

# Get dependencies
flutter pub get

# Run on device
flutter run
```

## Struktur Folder

```
mobile/
├── README.md
├── src/                    # Source code
│   ├── screens/           # Screen/page components
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   ├── models/            # Data models
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   ├── theme/             # Styling & theme
│   └── navigation/        # Navigation setup
├── assets/                # Images, fonts, etc
├── config/                # Configuration files
└── package.json           # Dependencies (React Native)
```

## API Integration

Base URL: `http://localhost:8000/api`

### Endpoints Utama

- `GET /surat-masuk` - Daftar surat masuk
- `GET /surat-keluar` - Daftar surat keluar
- `GET /disposisi` - Daftar disposisi
- `GET /surat-arsip` - Daftar surat arsip
- `POST /backup/download` - Download backup database
- `POST /auth/login` - Login user

## Variabel Environment

Buat file `.env` di root folder mobile:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_API_TIMEOUT=10000
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## Build & Deployment

### Android

```bash
# Development APK
npm run build:android

# Production APK
npm run build:android:prod

# Generate AAB for Google Play
npm run build:android:aab
```

### iOS

```bash
# Development IPA
npm run build:ios

# Production IPA
npm run build:ios:prod
```

## Troubleshooting

### Koneksi API Gagal
- Pastikan backend Laravel sedang running
- Verifikasi `REACT_APP_API_URL` sudah benar
- Check firewall settings

### Port Conflict
- Ganti port di `.env` atau `app.json`
- Kill process yang menggunakan port tersebut

### Build Error
- Clear cache: `npm run clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Git Workflow

```bash
# Pull latest changes
git pull origin eoffice-copy

# Create feature branch
git checkout -b feature/mobile-feature

# Make changes dan commit
git add .
git commit -m "Add mobile feature"

# Push ke repository
git push origin feature/mobile-feature

# Create PR di GitHub
```

## Dokumentasi

- [React Native Docs](https://reactnative.dev/)
- [Flutter Docs](https://flutter.dev/docs)
- [Backend API Docs](../backend/README.md)
- [Frontend Docs](../frontend/README.md)

## Lisensi

Proprietary - E-Office System

## Support

Untuk bantuan, buat issue di GitHub atau hubungi tim development.

---

**Last Updated**: 2026-07-02
**Status**: Ready for Development
