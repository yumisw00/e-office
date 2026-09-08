<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>&#128680; Alert Keamanan Admin</h2>
        </div>
        <div class="content">
            <p>Yth. Admin,</p>
            
            <div class="alert">
                <strong>User dengan percobaan login gagal berlebihan</strong>
            </div>
            
            <p>Detail:</p>
            <table>
                <tr>
                    <td><strong>Nama</strong></td>
                    <td>{{ $user->name }}</td>
                </tr>
                <tr>
                    <td><strong>Email</strong></td>
                    <td>{{ $user->email }}</td>
                </tr>
                <tr>
                    <td><strong>Percobaan Gagal</strong></td>
                    <td>{{ $attempts }} kali</td>
                </tr>
                <tr>
                    <td><strong>Waktu</strong></td>
                    <td>{{ $time }}</td>
                </tr>
                <tr>
                    <td><strong>IP Address</strong></td>
                    <td>{{ $ip }}</td>
                </tr>
            </table>
            
            <p>Akun pengguna telah dikunci secara otomatis.</p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem.</p>
        </div>
    </div>
</body>
</html>