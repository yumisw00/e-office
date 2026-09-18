<?php

return [
    'client_id' => env('GOOGLE_DRIVE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_DRIVE_CLIENT_SECRET'),
    'refresh_token' => env('GOOGLE_DRIVE_REFRESH_TOKEN'),
    'folder_id' => env('GOOGLE_DRIVE_FOLDER_ID'),
    'token_cache_key' => env('GOOGLE_DRIVE_TOKEN_CACHE_KEY', 'google_drive_token'),
];
