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
    public function __construct() {}

    public function getfile()
    {
        if (!auth()->check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $file_name = 'USER GUIDE.docx.pdf';

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
                'Content-Disposition' => 'inline; filename="' . $file_name . '"',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]
        );
    }
}
