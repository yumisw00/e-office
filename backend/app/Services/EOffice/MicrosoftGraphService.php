<?php

namespace App\Services\EOffice;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class MicrosoftGraphService
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
        return collect(['tenant_id', 'client_id', 'client_secret', 'drive_id'])
            ->every(fn ($key) => filled(config('office365.' . $key)));
    }

    public function uploadAndCreateEditLink(string $absolutePath, string $targetFileName, ?string $folderPath = null): array
    {
        if (!is_file($absolutePath)) {
            throw new RuntimeException('File dokumen lokal tidak ditemukan.');
        }

        $driveItem = $this->uploadSmallFile($absolutePath, $targetFileName, $folderPath);
        $link = $this->createSharingLink($driveItem['id']);

        return [
            'drive_item_id' => $driveItem['id'],
            'name' => $driveItem['name'] ?? $targetFileName,
            'web_url' => $link['link']['webUrl'] ?? ($driveItem['webUrl'] ?? null),
            'drive_web_url' => $driveItem['webUrl'] ?? null,
            'created_link' => $link['link'] ?? null,
        ];
    }

    private function uploadSmallFile(string $absolutePath, string $targetFileName, ?string $folderPath = null): array
    {
        $folder = $this->normalizeFolder($folderPath ?? config('office365.folder_path'));
        $targetPath = trim($folder . '/' . $this->sanitizeFileName($targetFileName), '/');
        $url = sprintf(
            '%s/drives/%s/root:/%s:/content',
            rtrim(config('office365.graph_base_url'), '/'),
            rawurlencode(config('office365.drive_id')),
            $this->encodeDrivePath($targetPath)
        );

        $response = $this->client->put($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken(),
                'Content-Type' => $this->contentTypeFor($absolutePath),
            ],
            'body' => fopen($absolutePath, 'rb'),
        ]);

        return $this->decodeGraphResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal mengunggah dokumen ke Office 365.');
    }

    private function createSharingLink(string $driveItemId): array
    {
        $url = sprintf(
            '%s/drives/%s/items/%s/createLink',
            rtrim(config('office365.graph_base_url'), '/'),
            rawurlencode(config('office365.drive_id')),
            rawurlencode($driveItemId)
        );

        $response = $this->client->post($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'type' => config('office365.sharing_type', 'edit'),
                'scope' => config('office365.sharing_scope', 'organization'),
                'retainInheritedPermissions' => true,
            ],
        ]);

        return $this->decodeGraphResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal membuat link edit Office 365.');
    }

    private function accessToken(): string
    {
        $this->assertConfigured();

        return Cache::remember(config('office365.token_cache_key'), now()->addMinutes(50), function () {
            $url = sprintf(
                '%s/%s/oauth2/v2.0/token',
                rtrim(config('office365.login_base_url'), '/'),
                rawurlencode(config('office365.tenant_id'))
            );

            try {
                $response = $this->client->post($url, [
                    'form_params' => [
                        'client_id' => config('office365.client_id'),
                        'client_secret' => config('office365.client_secret'),
                        'scope' => 'https://graph.microsoft.com/.default',
                        'grant_type' => 'client_credentials',
                    ],
                ]);
            } catch (GuzzleException $exception) {
                throw new RuntimeException('Gagal mengambil token Microsoft Graph: ' . $exception->getMessage(), 0, $exception);
            }

            $payload = $this->decodeGraphResponse($response->getStatusCode(), (string) $response->getBody(), 'Gagal mengambil token Microsoft Graph.');

            if (empty($payload['access_token'])) {
                throw new RuntimeException('Token Microsoft Graph tidak ditemukan pada response.');
            }

            return $payload['access_token'];
        });
    }

    private function assertConfigured(): void
    {
        if ($this->isConfigured()) return;

        throw new RuntimeException('Konfigurasi Office 365 belum lengkap. Isi OFFICE365_TENANT_ID, OFFICE365_CLIENT_ID, OFFICE365_CLIENT_SECRET, dan OFFICE365_DRIVE_ID.');
    }

    private function decodeGraphResponse(int $status, string $body, string $fallbackMessage): array
    {
        $payload = json_decode($body, true) ?: [];

        if ($status >= 200 && $status < 300) {
            return $payload;
        }

        $message = data_get($payload, 'error.message') ?: data_get($payload, 'error_description') ?: $fallbackMessage;
        throw new RuntimeException($message);
    }

    private function normalizeFolder(?string $folderPath): string
    {
        return trim((string) $folderPath, " /\t\n\r\0\x0B");
    }

    private function encodeDrivePath(string $path): string
    {
        return collect(explode('/', $path))
            ->filter(fn ($segment) => $segment !== '')
            ->map(fn ($segment) => rawurlencode($segment))
            ->implode('/');
    }

    private function sanitizeFileName(string $fileName): string
    {
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $baseName = pathinfo($fileName, PATHINFO_FILENAME) ?: 'dokumen';
        $safeBaseName = Str::slug($baseName) ?: 'dokumen';

        return $safeBaseName . ($extension ? '.' . strtolower($extension) : '.docx');
    }

    private function contentTypeFor(string $absolutePath): string
    {
        return match (strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION))) {
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc' => 'application/msword',
            'pdf' => 'application/pdf',
            default => 'application/octet-stream',
        };
    }
}
