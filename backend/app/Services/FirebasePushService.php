<?php

namespace App\Services;

use Firebase\JWT\JWT;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FirebasePushService
{
    public function sendToUser(int $userId, string $title, ?string $body, array $data = []): void
    {
        $deviceToken = DB::table('sys_user')->where('id_user', $userId)->value('fcm_token');
        $credentialsPath = config('services.firebase.credentials');
        if (!$deviceToken || !$credentialsPath || !is_file($credentialsPath)) return;

        try {
            $credentials = json_decode(file_get_contents($credentialsPath), true, flags: JSON_THROW_ON_ERROR);
            (new Client(['timeout' => 5]))->post(
                'https://fcm.googleapis.com/v1/projects/' . $credentials['project_id'] . '/messages:send',
                [
                    'headers' => ['Authorization' => 'Bearer ' . $this->accessToken($credentials)],
                    'json' => ['message' => [
                        'token' => $deviceToken,
                        'notification' => ['title' => $title, 'body' => $body ?? ''],
                        'data' => collect($data)->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))->all(),
                    ]],
                ]
            );
        } catch (\Throwable $exception) {
            Log::warning('Push notification FCM gagal dikirim.', ['id_user' => $userId, 'error' => $exception->getMessage()]);
        }
    }

    private function accessToken(array $credentials): string
    {
        return Cache::remember('firebase_oauth_token', 3300, function () use ($credentials) {
            $now = time();
            $assertion = JWT::encode([
                'iss' => $credentials['client_email'],
                'sub' => $credentials['client_email'],
                'aud' => $credentials['token_uri'],
                'iat' => $now,
                'exp' => $now + 3600,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            ], $credentials['private_key'], 'RS256');
            $response = (new Client(['timeout' => 5]))->post($credentials['token_uri'], ['form_params' => [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $assertion,
            ]]);
            return json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR)['access_token'];
        });
    }
}
