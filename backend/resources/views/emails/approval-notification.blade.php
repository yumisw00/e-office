<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 720px; margin: 0 auto; padding: 20px; }
        .header { background: #138a98; color: #fff; padding: 20px; }
        .content { padding: 20px; background: #f8f9fa; }
        .box { background: #fff; border: 1px solid #dee2e6; padding: 16px; margin: 16px 0; border-radius: 6px; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .detail-table td { padding: 8px 12px; border: 1px solid #ddd; vertical-align: top; }
        .detail-table td:first-child { font-weight: bold; width: 35%; color: #555; background: #f8f9fa; }
        .btn { display: inline-block; padding: 10px 20px; background: #138a98; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { padding: 16px 0; text-align: center; font-size: 12px; color: #888; }
        .status-approved { color: #16a34a; font-weight: bold; }
        .status-rejected { color: #dc2626; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">{{ config('app.name', 'E-Office') }}</h2>
        </div>
        <div class="content">
            <p>{{ $greeting }},</p>
            <p>{!! $body !!}</p>

            @if(count($detailRows) > 0)
            <div class="box">
                <table class="detail-table">
                    @foreach($detailRows as $row)
                    <tr>
                        <td>{{ $row['label'] }}</td>
                        <td>{!! $row['value'] !!}</td>
                    </tr>
                    @endforeach
                </table>
            </div>
            @endif

            @if($actionText && $actionUrl)
            <div style="text-align: center; margin: 20px 0;">
                <a href="{{ $actionUrl }}" class="btn">{{ $actionText }}</a>
            </div>
            @endif

            @if($footerNote)
            <p style="font-size: 12px; color: #888;">{{ $footerNote }}</p>
            @endif
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem E-Office. Mohon jangan membalas email ini.</p>
        </div>
    </div>
</body>
</html>
