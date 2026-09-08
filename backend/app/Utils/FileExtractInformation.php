<?php

namespace App\Utils;

use Illuminate\Support\Str;

class FileExtractInformation
{
    private const DEFAULT_CONFIG = [
        'api_key' => '5e17d45e58c042ea91c16c0660b92604.ISvRobpIyScEgJJWUPdBmKMD',
        'base_url' => 'https://ollama.com',
        'model_vision' => 'gemma3:27b-cloud',
        'curl_timeout' => 0,
        'save_respond' => 1,
        'vision_min_text_length' => 150,
        'pdf_vision_pages_with_text' => 2,
        'pdf_vision_pages_without_text' => 4,
        'docx_vision_max_images' => 4,
        'vision_max_images_per_request' => 2,
        'pdf_vision_scale_to' => 1100,
    ];

    private $apiKey;
    private $url;
    private $modelVision;
    private $curlTimeout;
    private $saveRespond;
    private $visionMinTextLength;
    private $pdfVisionPagesWithText;
    private $pdfVisionPagesWithoutText;
    private $docxVisionMaxImages;
    private $visionMaxImagesPerRequest;
    private $pdfVisionScaleTo;

    public function __construct(array $config = [])
    {
        $config = array_merge(self::DEFAULT_CONFIG, $config);

        $this->apiKey = $config['api_key'];
        $this->url = rtrim((string) $config['base_url'], '/');
        $this->modelVision = $config['model_vision'];
        $this->curlTimeout = (int) $config['curl_timeout'];
        $this->saveRespond = (int) $config['save_respond'];
        $this->visionMinTextLength = (int) $config['vision_min_text_length'];
        $this->pdfVisionPagesWithText = max(0, (int) $config['pdf_vision_pages_with_text']);
        $this->pdfVisionPagesWithoutText = max(0, (int) $config['pdf_vision_pages_without_text']);
        $this->docxVisionMaxImages = max(0, (int) $config['docx_vision_max_images']);
        $this->visionMaxImagesPerRequest = max(1, (int) $config['vision_max_images_per_request']);
        $this->pdfVisionScaleTo = max(600, (int) $config['pdf_vision_scale_to']);
    }

    public function extract($path)
    {
        $path = (string) $path;
        $extension = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));
        $displayName = basename($path);

        $result = [
            'status' => false,
            'message' => null,
            'file_path' => $path,
            'file_name' => $displayName,
            'extension' => $extension,
            'mime_type' => $this->detectMimeType($path),
            'size' => is_file($path) ? @filesize($path) : null,
            'file_type' => $this->detectFileType($extension),
            'text' => null,
            'visual_summary' => null,
            'content' => null,
            'sections' => [],
        ];

        if ($path === '' || !is_file($path)) {
            $result['message'] = 'File tidak ditemukan.';
            return $result;
        }

        if (!is_readable($path)) {
            $result['message'] = 'File tidak dapat dibaca.';
            return $result;
        }

        if ($result['file_type'] === 'unsupported') {
            $result['message'] = 'Tipe file tidak didukung.';
            return $result;
        }

        $extracted = $this->extractByType($path, $displayName, $result['file_type']);
        $result = array_merge($result, $extracted);
        $result['status'] = $result['content'] !== null;
        $result['message'] = $result['status']
            ? 'Informasi file berhasil diekstrak.'
            : 'Tidak ada informasi yang berhasil diekstrak dari file.';

        return $result;
    }

    private function extractByType($path, $displayName, $fileType)
    {
        if ($fileType === 'image') {
            $text = $this->imgtotxt($path);

            return [
                'text' => null,
                'visual_summary' => $this->normalizeExtractedText($text),
                'content' => $this->formatExtractedFileContent($displayName, 'HASIL ANALISIS GAMBAR', $text),
                'sections' => $this->buildSectionsArray([
                    'HASIL ANALISIS GAMBAR' => $text,
                ]),
            ];
        }

        if ($fileType === 'pdf') {
            return $this->extractPdfInformation($path, $displayName);
        }

        if ($fileType === 'docx') {
            return $this->extractDocxInformation($path, $displayName);
        }

        if ($fileType === 'doc') {
            return $this->extractLegacyWordInformation($path, $displayName);
        }

        return [
            'text' => null,
            'visual_summary' => null,
            'content' => null,
            'sections' => [],
        ];
    }

    private function extractPdfInformation($path, $displayName)
    {
        $text = $this->normalizeExtractedText($this->pdftotxt($path));
        $visualSummary = $this->extractPdfVisualSummary($path, $text);

        $sections = $this->buildSectionsArray([
            'HASIL EKSTRAKSI TEKS PDF' => $text,
            'BUKTI VISUAL PDF' => $visualSummary,
        ]);

        return [
            'text' => $text,
            'visual_summary' => $visualSummary,
            'content' => $this->formatExtractedFileContent(
                $displayName,
                null,
                $this->sectionsToString($sections)
            ),
            'sections' => $sections,
        ];
    }

    private function extractDocxInformation($path, $displayName)
    {
        $text = $this->normalizeExtractedText($this->docxtotxt($path));
        $visualSummary = $this->extractDocxVisualSummary($path);

        $sections = $this->buildSectionsArray([
            'HASIL EKSTRAKSI TEKS DOCX' => $text,
            'BUKTI VISUAL DOCX' => $visualSummary,
        ]);

        return [
            'text' => $text,
            'visual_summary' => $visualSummary,
            'content' => $this->formatExtractedFileContent(
                $displayName,
                null,
                $this->sectionsToString($sections)
            ),
            'sections' => $sections,
        ];
    }

    private function extractLegacyWordInformation($path, $displayName)
    {
        $convertedPdf = $this->convertOfficeFileToPdf($path);
        if (!$convertedPdf) {
            $message = 'File DOC gagal dikonversi ke PDF untuk dianalisa.';

            return [
                'text' => null,
                'visual_summary' => null,
                'content' => $this->formatExtractedFileContent($displayName, 'HASIL EKSTRAKSI', $message),
                'sections' => $this->buildSectionsArray([
                    'HASIL EKSTRAKSI' => $message,
                ]),
            ];
        }

        $result = $this->extractPdfInformation($convertedPdf, $displayName);
        $this->cleanupTempFiles([$convertedPdf]);
        @rmdir(dirname($convertedPdf));

        return $result;
    }

    private function buildSectionsArray(array $sections)
    {
        $result = [];

        foreach ($sections as $label => $content) {
            $content = $this->normalizeExtractedText($content);
            if ($content === null) {
                continue;
            }

            $result[] = [
                'label' => (string) $label,
                'content' => $content,
            ];
        }

        return $result;
    }

    private function sectionsToString(array $sections)
    {
        $parts = [];

        foreach ($sections as $section) {
            $label = trim((string) ($section['label'] ?? ''));
            $content = $this->normalizeExtractedText($section['content'] ?? null);
            if ($label === '' || $content === null) {
                continue;
            }

            $parts[] = '[' . $label . ']' . "\n" . $content;
        }

        return !empty($parts) ? implode("\n\n", $parts) : null;
    }

    private function detectFileType($extension)
    {
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])) {
            return 'image';
        }

        if ($extension === 'pdf') {
            return 'pdf';
        }

        if ($extension === 'docx') {
            return 'docx';
        }

        if ($extension === 'doc') {
            return 'doc';
        }

        return 'unsupported';
    }

    private function detectMimeType($path)
    {
        if (!is_file($path)) {
            return null;
        }

        if (function_exists('mime_content_type')) {
            $mimeType = @mime_content_type($path);
            if (is_string($mimeType) && $mimeType !== '') {
                return $mimeType;
            }
        }

        return null;
    }

    private function formatExtractedFileContent($displayName, $sectionLabel = null, $content = null)
    {
        $parts = ['[FILE] ' . $displayName];

        $content = $this->normalizeExtractedText($content);
        if ($content === null) {
            $parts[] = '[HASIL EKSTRAKSI]';
            $parts[] = 'Tidak ada teks atau bukti visual yang berhasil dibaca dari file ini.';
            return implode("\n", $parts);
        }

        if ($sectionLabel !== null) {
            $parts[] = '[' . $sectionLabel . ']';
        }

        $parts[] = $content;

        return implode("\n", $parts);
    }

    private function normalizeExtractedText($text)
    {
        $text = trim((string) $text);
        if ($text === '') {
            return null;
        }

        $text = preg_replace("/[\\t\\r]+/", ' ', $text);
        $text = preg_replace("/\\n{3,}/", "\n\n", (string) $text);
        $text = trim((string) $text);

        return $text !== '' ? $text : null;
    }

    private function hasMeaningfulText($text)
    {
        $text = $this->normalizeExtractedText($text);
        if ($text === null) {
            return false;
        }

        $len = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
        return $len >= max(1, $this->visionMinTextLength);
    }

    private function extractPdfVisualSummary($path, $plainText = null)
    {
        $pageCount = $this->getPdfPageCount($path);
        if ($pageCount <= 0) {
            return null;
        }

        $maxPages = $this->hasMeaningfulText($plainText)
            ? $this->pdfVisionPagesWithText
            : $this->pdfVisionPagesWithoutText;

        if ($maxPages <= 0) {
            return null;
        }

        $pages = $this->pickPdfPages($pageCount, $maxPages);
        if (empty($pages)) {
            return null;
        }

        $renderedPages = $this->renderPdfPagesToImages($path, $pages);
        if (empty($renderedPages)) {
            return null;
        }

        $summaryParts = [];
        $labels = [];
        foreach (array_keys($renderedPages) as $pageNumber) {
            $labels[] = 'halaman ' . $pageNumber;
        }

        $batches = $this->buildImageBatches(
            array_values($renderedPages),
            $labels,
            $this->visionMaxImagesPerRequest
        );

        foreach ($batches as $batch) {
            $summary = $this->visiontotxt(
                $batch['paths'],
                $this->buildVisionPrompt('halaman PDF', $batch['labels'])
            );
            if ($summary !== null) {
                $summaryParts[] = $summary;
            }
        }

        $this->cleanupTempFiles(array_values($renderedPages));
        $firstImage = reset($renderedPages);
        if ($firstImage) {
            @rmdir(dirname($firstImage));
        }

        return !empty($summaryParts) ? implode("\n\n", $summaryParts) : null;
    }

    private function extractDocxVisualSummary($path)
    {
        if ($this->docxVisionMaxImages <= 0 || !class_exists(\ZipArchive::class)) {
            return null;
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return null;
        }

        $mediaEntries = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $name = $stat['name'] ?? null;
            if (!is_string($name)) {
                continue;
            }

            if (!preg_match('#^word/media/.+\\.(png|jpe?g|gif|bmp|webp)$#i', $name)) {
                continue;
            }

            $mediaEntries[] = $name;
        }

        if (empty($mediaEntries)) {
            $zip->close();
            return null;
        }

        $selectedEntries = $this->pickOrderedSamples($mediaEntries, $this->docxVisionMaxImages);
        $tempDir = storage_path('app/' . uniqid('docx_media_', true));
        if (!@mkdir($tempDir, 0775, true) && !is_dir($tempDir)) {
            $zip->close();
            return null;
        }

        $imagePaths = [];
        $labels = [];
        foreach ($selectedEntries as $entryName) {
            $binary = $zip->getFromName($entryName);
            if (!is_string($binary) || $binary === '') {
                continue;
            }

            $outputPath = $tempDir . '/' . basename($entryName);
            if (@file_put_contents($outputPath, $binary) === false) {
                continue;
            }

            $imagePaths[] = $outputPath;
            $labels[] = basename($entryName);
        }
        $zip->close();

        if (empty($imagePaths)) {
            @rmdir($tempDir);
            return null;
        }

        $summaryParts = [];
        $batches = $this->buildImageBatches(
            $imagePaths,
            $labels,
            $this->visionMaxImagesPerRequest
        );

        foreach ($batches as $batch) {
            $summary = $this->visiontotxt(
                $batch['paths'],
                $this->buildVisionPrompt('gambar dari DOCX', $batch['labels'])
            );
            if ($summary !== null) {
                $summaryParts[] = $summary;
            }
        }

        $this->cleanupTempFiles($imagePaths);
        @rmdir($tempDir);

        return !empty($summaryParts) ? implode("\n\n", $summaryParts) : null;
    }

    private function getPdfPageCount($path)
    {
        $cmd = 'pdfinfo ' . escapeshellarg($path) . ' 2>&1';
        $output = [];
        $exitCode = 0;
        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0 || empty($output)) {
            return 0;
        }

        foreach ($output as $line) {
            if (preg_match('/^Pages\\s*:\\s*(\\d+)/i', trim((string) $line), $matches)) {
                return (int) $matches[1];
            }
        }

        return 0;
    }

    private function convertOfficeFileToPdf($path)
    {
        $tempDir = storage_path('app/' . uniqid('office_pdf_', true));
        if (!@mkdir($tempDir, 0775, true) && !is_dir($tempDir)) {
            return null;
        }

        $cmd = 'soffice --headless --convert-to pdf --outdir ' . escapeshellarg($tempDir) . ' ' . escapeshellarg($path) . ' 2>&1';
        $output = [];
        $exitCode = 0;
        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            @rmdir($tempDir);
            return null;
        }

        $pdfFiles = glob($tempDir . '/*.pdf');
        if (empty($pdfFiles)) {
            @rmdir($tempDir);
            return null;
        }

        return $pdfFiles[0];
    }

    private function pickPdfPages($pageCount, $limit)
    {
        if ($pageCount <= 0 || $limit <= 0) {
            return [];
        }

        if ($pageCount <= $limit) {
            return range(1, $pageCount);
        }

        if ($limit === 1) {
            return [$pageCount];
        }

        $pages = [];
        for ($i = 0; $i < $limit; $i++) {
            $ratio = $i / ($limit - 1);
            $page = (int) round(1 + (($pageCount - 1) * $ratio));
            $pages[] = max(1, min($pageCount, $page));
        }

        $pages = array_values(array_unique($pages));
        sort($pages);

        return $pages;
    }

    private function pickOrderedSamples(array $items, $limit)
    {
        $items = array_values($items);
        $count = count($items);
        if ($count <= $limit) {
            return $items;
        }

        if ($limit <= 1) {
            return [$items[$count - 1]];
        }

        $indexes = [];
        for ($i = 0; $i < $limit; $i++) {
            $ratio = $i / ($limit - 1);
            $index = (int) round(($count - 1) * $ratio);
            $indexes[] = max(0, min($count - 1, $index));
        }

        $indexes = array_values(array_unique($indexes));
        sort($indexes);

        $result = [];
        foreach ($indexes as $index) {
            $result[] = $items[$index];
        }

        return $result;
    }

    private function buildImageBatches(array $paths, array $labels, $maxItems)
    {
        $paths = array_values($paths);
        $labels = array_values($labels);
        $maxItems = max(1, (int) $maxItems);

        $batches = [];
        $currentPaths = [];
        $currentLabels = [];

        foreach ($paths as $index => $path) {
            $currentPaths[] = $path;
            $currentLabels[] = $labels[$index] ?? basename((string) $path);

            if (count($currentPaths) >= $maxItems) {
                $batches[] = [
                    'paths' => $currentPaths,
                    'labels' => $currentLabels,
                ];
                $currentPaths = [];
                $currentLabels = [];
            }
        }

        if (!empty($currentPaths)) {
            $batches[] = [
                'paths' => $currentPaths,
                'labels' => $currentLabels,
            ];
        }

        return $batches;
    }

    private function renderPdfPagesToImages($path, array $pages)
    {
        if (empty($pages)) {
            return [];
        }

        $tempDir = storage_path('app/' . uniqid('pdf_pages_', true));
        if (!@mkdir($tempDir, 0775, true) && !is_dir($tempDir)) {
            return [];
        }

        $renderedPages = [];
        foreach ($pages as $pageNumber) {
            $pageNumber = (int) $pageNumber;
            if ($pageNumber <= 0) {
                continue;
            }

            $prefix = $tempDir . '/page';
            $cmd = 'pdftoppm -jpeg -f ' . $pageNumber . ' -l ' . $pageNumber . ' -scale-to ' . $this->pdfVisionScaleTo . ' ' . escapeshellarg($path) . ' ' . escapeshellarg($prefix) . ' 2>&1';
            $output = [];
            $exitCode = 0;
            exec($cmd, $output, $exitCode);

            $imagePath = $prefix . '-' . $pageNumber . '.jpg';
            if ($exitCode === 0 && file_exists($imagePath)) {
                $renderedPages[$pageNumber] = $imagePath;
            }
        }

        if (empty($renderedPages)) {
            @rmdir($tempDir);
        }

        return $renderedPages;
    }

    private function cleanupTempFiles(array $paths)
    {
        foreach ($paths as $path) {
            if (is_string($path) && $path !== '' && file_exists($path)) {
                @unlink($path);
            }
        }
    }

    private function buildVisionPrompt($sourceLabel, array $orderedLabels = [])
    {
        $labelsText = '';
        if (!empty($orderedLabels)) {
            $labelsText = 'Urutan gambar mewakili: ' . implode(', ', $orderedLabels) . '. ';
        }

        return trim(
            'Gunakan bahasa Indonesia. ' .
                $labelsText .
                'Ekstrak seluruh teks penting yang terlihat dari ' . $sourceLabel . '. ' .
                'Selain OCR, jelaskan bukti visual penting yang relevan untuk analisa audit seperti tanda tangan, paraf, cap atau stempel, checkbox, tanda centang, tulisan tangan, tanggal, nama, jabatan, nilai nominal, dan lampiran foto. ' .
                'Jika ada bagian yang tidak terbaca, sebutkan secara singkat. ' .
                'Kembalikan jawaban ringkas dalam teks biasa, bukan JSON dan bukan markdown.'
        );
    }

    private function pdftotxt($path)
    {
        $outPath = storage_path('app/' . uniqid('pdftotext_', true) . '.txt');
        $cmd = 'pdftotext -q -enc UTF-8 ' . escapeshellarg($path) . ' ' . escapeshellarg($outPath) . ' 2>&1';
        $cmdOut = [];
        $exitCode = 0;
        exec($cmd, $cmdOut, $exitCode);

        $text = '';
        if (file_exists($outPath)) {
            $text = file_get_contents($outPath);
            @unlink($outPath);
            $text = is_string($text) ? trim($text) : '';
        }

        if ($text !== '') {
            return $text;
        }

        if ($exitCode === 0) {
            return null;
        }

        $repairedPdf = storage_path('app/' . uniqid('pdf_repair_', true) . '.pdf');
        $gsCmd = 'gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -sOutputFile=' . escapeshellarg($repairedPdf) . ' ' . escapeshellarg($path) . ' 2>&1';
        $gsOut = [];
        $gsExit = 0;
        exec($gsCmd, $gsOut, $gsExit);

        if ($gsExit !== 0 || !file_exists($repairedPdf)) {
            @unlink($repairedPdf);
            return null;
        }

        $outPath2 = storage_path('app/' . uniqid('pdftotext_', true) . '.txt');
        $cmd2 = 'pdftotext -q -enc UTF-8 ' . escapeshellarg($repairedPdf) . ' ' . escapeshellarg($outPath2) . ' 2>&1';
        $cmd2Out = [];
        $exitCode2 = 0;
        exec($cmd2, $cmd2Out, $exitCode2);
        @unlink($repairedPdf);

        if (!file_exists($outPath2)) {
            return null;
        }

        $text2 = file_get_contents($outPath2);
        @unlink($outPath2);
        $text2 = is_string($text2) ? trim($text2) : '';

        return $text2 !== '' ? $text2 : null;
    }

    private function docxtotxt($path)
    {
        if (!class_exists(\ZipArchive::class)) {
            return null;
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return null;
        }

        $xmlParts = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $name = $stat['name'] ?? null;
            if (!is_string($name)) {
                continue;
            }

            if ($name !== 'word/document.xml' && !preg_match('#^word/(header|footer)[0-9]*\\.xml$#i', $name)) {
                continue;
            }

            $xml = $zip->getFromName($name);
            if (is_string($xml) && $xml !== '') {
                $xmlParts[] = $xml;
            }
        }
        $zip->close();

        if (empty($xmlParts)) {
            return null;
        }

        $textParts = [];
        foreach ($xmlParts as $xmlPart) {
            $xmlPart = str_replace(['</w:p>', '</w:tr>', '</w:tc>'], "\n", $xmlPart);
            $partText = strip_tags($xmlPart);
            $partText = html_entity_decode($partText, ENT_QUOTES | ENT_XML1, 'UTF-8');
            $partText = preg_replace("/\\n{3,}/", "\n\n", (string) $partText);
            $partText = trim((string) $partText);
            if ($partText !== '') {
                $textParts[] = $partText;
            }
        }

        $text = implode("\n\n", $textParts);
        $text = trim((string) $text);

        return $text !== '' ? $text : null;
    }

    private function imgtotxt($path)
    {
        return $this->visiontotxt(
            [$path],
            $this->buildVisionPrompt('file gambar', [basename($path)])
        );
    }

    private function visiontotxt(array $imagePaths, $instruction)
    {
        $url = $this->url . '/api/chat';
        $images = [];

        foreach ($imagePaths as $imagePath) {
            if (!is_string($imagePath) || $imagePath === '' || !file_exists($imagePath)) {
                continue;
            }

            $binary = @file_get_contents($imagePath);
            if (!is_string($binary) || $binary === '') {
                continue;
            }

            $images[] = base64_encode($binary);
        }

        if (empty($images)) {
            return null;
        }

        $messages = [
            'role' => 'user',
            'content' => $instruction,
            'images' => $images,
        ];
        $req = [
            'model' => $this->modelVision,
            'messages' => [$messages],
            'stream' => false,
        ];

        $return = $this->accessApi($url, json_encode($req, JSON_INVALID_UTF8_SUBSTITUTE));
        $return = json_decode((string) $return, true);

        if (empty($return['message'])) {
            return null;
        }

        return $this->normalizeExtractedText($return['message']['content'] ?? null);
    }

    private function accessApi($url, $req)
    {
        $send = date('d-m-Y H:i:s');

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => $this->curlTimeout,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $req,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);

        if ($this->saveRespond) {
            $logDir = storage_path('ai_generate');
            if (!is_dir($logDir) && !mkdir($logDir, 0775, true) && !is_dir($logDir)) {
                return $err ? null : $response;
            }

            $uniqueId = Str::uuid()->toString();
            $filePath = $logDir . DIRECTORY_SEPARATOR . 'file_extract_[' . date('d-m-Y H:i:s') . ']_' . $uniqueId . '.txt';
            $myfile = fopen($filePath, 'w');
            if ($myfile !== false) {
                fwrite($myfile, "[send] $send" . "\n[return] " . date('d-m-Y H:i:s') . "\n[url] $url\n[req]\n=>$req\n[response]\n=>$response\n[error]\n$err");
                fclose($myfile);
            }
        }

        if ($err) {
            return null;
        }

        return $response;
    }
}
