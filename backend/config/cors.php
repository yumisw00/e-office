<?php

$isLocalEnvironment = in_array(env('APP_ENV', 'production'), ['local', 'development', 'testing'], true);
$defaultOrigins = $isLocalEnvironment
    ? 'http://localhost:5173,http://127.0.0.1:5173'
    : '';
$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URLS', $defaultOrigins))
)));
$allowPrivateNetworkOrigins = filter_var(
    env('CORS_ALLOW_PRIVATE_NETWORK_ORIGINS', $isLocalEnvironment),
    FILTER_VALIDATE_BOOL
);

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    // In production, FRONTEND_URLS must contain the explicit HTTPS frontend origins.
    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => $allowPrivateNetworkOrigins ? [
        '#^http://192\.168\.\d+\.\d+:(5173|3000)$#',
        '#^http://10\.\d+\.\d+\.\d+:(5173|3000)$#',
        '#^http://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:(5173|3000)$#',
    ] : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
