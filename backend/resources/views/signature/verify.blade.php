<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verifikasi Tanda Tangan Digital</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f7fb; color: #1f2937; margin: 0; padding: 24px; }
        .card { max-width: 840px; margin: 0 auto; background: #fff; border: 1px solid #dbe4ea; border-radius: 10px; overflow: hidden; }
        .header { background: #138a98; color: white; padding: 20px 24px; }
        .body { padding: 24px; }
        .status { display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 13px; }
        .ok { background: #dcfce7; color: #166534; }
        .bad { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
        .muted { color: #6b7280; font-size: 12px; }
        .link { word-break: break-all; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 style="margin: 0; font-size: 22px;">Verifikasi Tanda Tangan Digital</h1>
        </div>
        <div class="body">
            @if ($found)
                <div class="status {{ $integrityValid ? 'ok' : 'bad' }}">
                    {{ $integrityValid ? 'Valid' : 'Tidak valid' }}
                </div>
                <p class="muted" style="margin-top: 12px;">
                    {{ $integrityValid ? 'Hash file cocok dengan data yang tersimpan.' : 'Hash file saat ini tidak cocok atau file belum tersedia.' }}
                </p>
                <table>
                    <tr><td><strong>Nomor Surat</strong></td><td>{{ data_get($surat, 'nomor_surat') ?: data_get($surat, 'kode_draft') ?: '-' }}</td></tr>
                    <tr><td><strong>Perihal</strong></td><td>{{ data_get($surat, 'perihal') ?: '-' }}</td></tr>
                    <tr><td><strong>Penandatangan</strong></td><td>{{ $signerName ?: '-' }}</td></tr>
                    <tr><td><strong>Tanggal TTD</strong></td><td>{{ $signature->signed_at ?: '-' }}</td></tr>
                    <tr><td><strong>Serial Sertifikat</strong></td><td>{{ $signature->certificate_serial ?: '-' }}</td></tr>
                    <tr><td><strong>Hash Tersimpan</strong></td><td class="link">{{ $signature->hash_file ?: '-' }}</td></tr>
                    <tr><td><strong>Hash Saat Ini</strong></td><td class="link">{{ $currentHash ?: '-' }}</td></tr>
                    <tr><td><strong>QR Path</strong></td><td>{{ $signature->qr_code_path ?: '-' }}</td></tr>
                    @if (!empty($fileUrl))
                        <tr><td><strong>File</strong></td><td><a href="{{ $fileUrl }}" target="_blank" rel="noopener noreferrer">Buka dokumen</a></td></tr>
                    @endif
                </table>
                @if (!empty($signature->verification_url))
                    <p class="muted" style="margin-top: 18px;">URL verifikasi: <span class="link">{{ $signature->verification_url }}</span></p>
                @endif
            @else
                <div class="status bad">Tidak ditemukan</div>
                <p class="muted" style="margin-top: 12px;">Kode verifikasi tidak cocok dengan data signature mana pun.</p>
            @endif
        </div>
    </div>
</body>
</html>
