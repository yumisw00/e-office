<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>&#9888; Peringatan Keamanan</h2>
        </div>
        <div class="content">
            <p>Halo {{ $user->name }},</p>
            
            <div class="alert">
                <strong>Kami mendeteksi {{ $attempts }} percobaan login gagal</strong> pada akun Anda.
            </div>
            
            <p>Detail:</p>
            <ul>
                <li>Waktu: {{ $time }}</li>
                <li>IP Address: {{ $ip }}</li>
            </ul>
            
            <p>Jika ini bukan Anda, kami sarankan untuk:</p>
            <ol>
                <li>Segera mengubah password Anda</li>
                <li>Mengaktifkan 2FA jika belum aktif</li>
                <li>Menghubungi administrator jika Anda tidak mengenali aktivitas ini</li>
            </ol>
            
            <p style="text-align: center; margin: 20px 0;">
                <a href="{{ url('/force-password-change') }}" class="btn">Ubah Password</a>
            </p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>