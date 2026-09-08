<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Notifikasi Icofr</title>
</head>

<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e88e5;">{{ $data['title'] }}</h2>
        @if (!empty($data['body']))
        <p>Pesan: {!! $data['body'] !!}</p>
        @endif
        <p>Silakan klik tombol di bawah ini untuk melihat detail informasi lebih lanjut di aplikasi Icofr.</p>

        <p style="text-align: center;">
            <a href="{{ $data['url'] }}" style="display: inline-block; padding: 12px 24px; background-color: #1e88e5; color: #ffffff; text-decoration: none; border-radius: 5px;">Buka Aplikasi Icofr</a>
        </p>
        <p>Jika tombol tidak berfungsi, salin dan tempel link berikut di browser:</p>
        <p><a href="{{ $data['url'] }}">{{ $data['url'] }}</a></p>
        <hr style="margin-top: 30px;">
        <p style="font-size: 12px; color: #999;">Email ini dikirim otomatis, mohon tidak membalas.</p>
    </div>
</body>

</html>