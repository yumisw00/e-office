<?php

return [
    'tenant_id' => env('OFFICE365_TENANT_ID'),
    'client_id' => env('OFFICE365_CLIENT_ID'),
    'client_secret' => env('OFFICE365_CLIENT_SECRET'),
    'drive_id' => env('OFFICE365_DRIVE_ID'),
    'folder_path' => env('OFFICE365_FOLDER_PATH', 'E-Office'),
    'sharing_scope' => env('OFFICE365_SHARING_SCOPE', 'organization'),
    'sharing_type' => env('OFFICE365_SHARING_TYPE', 'edit'),
    'token_cache_key' => env('OFFICE365_TOKEN_CACHE_KEY', 'office365_graph_token'),
    'graph_base_url' => env('OFFICE365_GRAPH_BASE_URL', 'https://graph.microsoft.com/v1.0'),
    'login_base_url' => env('OFFICE365_LOGIN_BASE_URL', 'https://login.microsoftonline.com'),
];
