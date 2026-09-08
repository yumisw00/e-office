<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 720px; margin: 0 auto; padding: 20px; }
        .header { background: #138a98; color: #fff; padding: 20px; }
        .content { padding: 20px; background: #f8f9fa; }
        .box { background: #fff; border: 1px solid #dee2e6; padding: 16px; margin: 16px 0; }
        .muted { color: #6c757d; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
        .footer { padding: 16px 0; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">Surat Keluar Terkirim</h2>
        </div>
        <div class="content">
            <p>Yth. {{ $surat->tujuan_nama ?: 'Penerima' }},</p>
            <p>Surat keluar berikut sudah dikirim dari sistem E-Office.</p>

            <div class="box">
                <table>
                    <tr>
                        <td><strong>Nomor Surat</strong></td>
                        <td>{{ $surat->nomor_surat ?: $surat->kode_draft ?: '-' }}</td>
                    </tr>
                    <tr>
                        <td><strong>Perihal</strong></td>
                        <td>{{ $surat->perihal ?: '-' }}</td>
                    </tr>
                    <tr>
                        <td><strong>Tanggal</strong></td>
                        <td>{{ $surat->tanggal_surat ?: now()->format('Y-m-d') }}</td>
                    </tr>
                    <tr>
                        <td><strong>Penandatangan</strong></td>
                        <td>{{ $surat->nama_penandatangan ?: '-' }}</td>
                    </tr>
                </table>
            </div>

            @if (!empty($signature?->verification_url))
                <p>Verifikasi tanda tangan digital dapat dilakukan melalui tautan berikut:</p>
                <p style="word-break: break-all;"><a href="{{ $signature->verification_url }}">{{ $signature->verification_url }}</a></p>
            @endif

            @if (!empty($attachmentPath))
                <p>Lampiran surat terikut pada email ini.</p>
            @else
                <p>Informasi surat dikirim melalui email ini. Lampiran belum tersedia.</p>
            @endif
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem. Mohon jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>
