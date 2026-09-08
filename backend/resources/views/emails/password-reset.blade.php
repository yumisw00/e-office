<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
        .btn:hover { background: #0056b3; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>&#128274; Reset Password</h2>
        </div>
        <div class="content">
            <p>Halo {{ $user->name }},</p>
            
            <p>Kami menerima permintaan untuk reset password akun Anda.</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
            </p>
            
            <div class="warning">
                <strong>Peringatan:</strong>
                <ul>
                    <li>Link ini akan kedaluwarsa dalam 1 jam</li>
                    <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                </ul>
            </div>
            
            <p>Atau copy link berikut ke browser Anda:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">{{ $resetUrl }}</p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>