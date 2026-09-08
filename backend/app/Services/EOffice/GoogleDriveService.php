<?php

namespace App\Services\EOffice;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleDriveService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $this->client = $client ?: new Client([
            'timeout' => 60,
            'http_errors' => false,
        ]);
    }

    public function isConfigured(): bool
    {
        return collect(['client_id', 'client_secret', 'refresh_token', 'folder_id'])
            ->every(fn ($key) => filled(config('google_drive.' . $key)));
    }

    /**
     * Upload a local file to Google Drive and return a shareable edit link.
     *
     * @param  string  $absolutePath  Absolute path to the local file
     * @param  string  $targetFileName  Desired file name on Drive
     * @param  string|null  $mimeType  MIME type override
     * @return array{file_id: string, name: string, web_url: string, drive_url: string}
     */
    public function uploadAndCreateEditLink(string $absolutePath, string $targetFileName, ?string $mimeType = null): array
    {
        if (!is_file($absolutePath)) {
            throw new RuntimeException('File dokumen lokal tidak ditemukan.');
        }

        $fileId = $this->uploadFile($absolutePath, $targetFileName, $mimeType);
        $shareLink = $this->createSharingLink($fileId);

        return [
            'file_id' => $fileId,
            'name' => $targetFileName,
            'web_url' => $shareLink,
            'drive_url' => sprintf('https://drive.google.com/file/d/%s/view', $fileId),
        ];
    }

    private function uploadFile(string $absolutePath, string $targetFileName, ?string $mimeType = null): string
    {
        $folderId = config('google_drive.folder_id');
        $boundary = 'boundary_' . Str::random(16);
        $contentType = $mimeType ?? $this->contentTypeFor($absolutePath);

        $fileContent = file_get_contents($absolutePath);
        $metadataJson = json_encode([
            'name' => $targetFileName,
            'parents' => $folderId ? [$folderId] : [],
        ]);

        $body = $this->buildMultipartBody($boundary, $metadataJson, $contentType, $fileContent, $targetFileName);

        $url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        $response = $this->client->post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken(),
                'Content-Type' => 'multipart/related; boundary=' . $boundary,
            ],
            'body' => $body,
        ]);

        $payload = $this->decodeResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal mengunggah dokumen ke Google Drive.');

        if (empty($payload['id'])) {
            throw new RuntimeException('Google Drive tidak mengembalikan file ID.');
        }

        return $payload['id'];
    }

    private function createSharingLink(string $fileId): string
    {
        $url = sprintf(
            'https://www.googleapis.com/drive/v3/files/%s/permissions',
            rawurlencode($fileId)
        );

        $response = $this->client->post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'role' => 'writer',
                'type' => 'anyone',
            ],
        ]);

        $payload = $this->decodeResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal membuat link Google Drive.');

        // Return the edit link
        return sprintf('https://docs.google.com/document/d/%s/edit', $fileId);
    }

    private function accessToken(): string
    {
        $this->assertConfigured();

        return Cache::remember(config('google_drive.token_cache_key', 'google_drive_token'), now()->addMinutes(50), function () {
            $url = 'https://oauth2.googleapis.com/token';

            try {
                $response = $this->client->post($url, [
                    'form_params' => [
                        'client_id' => config('google_drive.client_id'),
                        'client_secret' => config('google_drive.client_secret'),
                        'refresh_token' => config('google_drive.refresh_token'),
                        'grant_type' => 'refresh_token',
                    ],
                ]);
            } catch (GuzzleException $exception) {
                throw new RuntimeException('Gagal mengambil token Google Drive: ' . $exception->getMessage(), 0, $exception);
            }

            $payload = $this->decodeResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal mengambil token Google Drive.');

            if (empty($payload['access_token'])) {
                throw new RuntimeException('Token Google Drive tidak ditemukan pada response.');
            }

            return $payload['access_token'];
        });
    }

    private function assertConfigured(): void
    {
        if ($this->isConfigured()) return;

        throw new RuntimeException(
            'Konfigurasi Google Drive belum lengkap. ' .
            'Isi GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, ' .
            'GOOGLE_DRIVE_REFRESH_TOKEN, dan GOOGLE_DRIVE_FOLDER_ID di file .env.'
        );
    }

    private function decodeResponse(int $status, string $body, string $fallbackMessage): array
    {
        $payload = json_decode($body, true) ?: [];

        if ($status >= 200 && $status < 300) {
            return $payload;
        }

        $message = $payload['error']['message']
            ?? $payload['error_description']
            ?? $fallbackMessage;
        throw new RuntimeException($message);
    }

    private function buildMultipartBody(string $boundary, string $metadataJson, string $contentType, string $fileContent, string $fileName): string
    {
        $body = '';
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
        $body .= $metadataJson . "\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: {$contentType}\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= rtrim(strtr(base64_encode($fileContent), '+/', '-_'), '=') . "\r\n";
        $body .= "--{$boundary}--\r\n";

        return $body;
    }

    private function contentTypeFor(string $absolutePath): string
    {
        return match (strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION))) {
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc'  => 'application/msword',
            'pdf'  => 'application/pdf',
            default => 'application/octet-stream',
        };
    }
}
