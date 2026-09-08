<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\BaseResourceController;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

use Pion\Laravel\ChunkUpload\Exceptions\UploadFailedException;
use Illuminate\Http\UploadedFile;
use Pion\Laravel\ChunkUpload\Exceptions\UploadMissingFileException;
use Pion\Laravel\ChunkUpload\Handler\AbstractHandler;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Illuminate\Support\Str;

/**
 * Class RcmCsaDokPendukungFilesAPIController
 * 
     
        'PT HK - ICOFR- USER GUIDE ADMINISTRATOR.pdf',
        'PT HK - ICOFR- USER GUIDE PREPARER LINE 1.pdf',
        'PT HK - ICOFR- USER GUIDE PREPARER LINE 2.pdf',
        'PT HK - ICOFR- USER GUIDE PREPARER LINE 3.pdf',
        'PT HK - ICOFR- USER GUIDE REVIEWER LINE 1.pdf',
        'PT HK - ICOFR- USER GUIDE REVIEWER LINE 2.pdf',
        'PT HK - ICOFR- USER GUIDE REVIEWER LINE 3.pdf',

 */
class UserGuideFiles extends BaseResourceController
{
    public $user_guide_by_group = [
        1 => "PT HK - ICOFR- USER GUIDE ADMINISTRATOR.pdf", # "Administrator"

        18 => "PT HK - ICOFR- USER GUIDE PREPARER LINE 1.pdf", # "Preparer Line 1"
        14 => "PT HK - ICOFR- USER GUIDE REVIEWER LINE 1.pdf", # "Reviewer Line 1"

        13 => "PT HK - ICOFR- USER GUIDE PREPARER LINE 2.pdf", # "Preparer Line 2"
        11 => "PT HK - ICOFR- USER GUIDE REVIEWER LINE 2.pdf", # "Reviewer Line 2"

        10 => "PT HK - ICOFR- USER GUIDE PREPARER LINE 3.pdf", # "Preparer Line 3"
        2 => "PT HK - ICOFR- USER GUIDE REVIEWER LINE 3.pdf", # "Reviewer Line 3"

        21 => "PT HK - ICOFR- USER GUIDE ADMINISTRATOR.pdf", # "Pengelola ICOFR"
    ];

    public function __construct() {}

    public function getfile()
    {
        if (!auth()->check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $id_group = session('id_group');
        // Group E-Office yang baru tidak menggunakan ID group ICOFR lama.
        // Tetap tampilkan panduan umum agar tombol Preview User Guide tidak
        // berakhir dengan 404 bagi group yang belum memiliki mapping khusus.
        $file_name = $this->user_guide_by_group[$id_group]
            ?? 'PT HK - ICOFR- USER GUIDE ADMINISTRATOR.pdf';

        $filePath = storage_path('user_guide/' . $file_name);

        // var_dump($filePath);
        // Periksa apakah file ada di server
        if (!file_exists($filePath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'File not found.'
            ], 404);
        }
        return response()->file(
            $filePath,
            [
                'Content-Disposition' => 'inline; filename=' . $file_name,
            ]
        );
    }
}
