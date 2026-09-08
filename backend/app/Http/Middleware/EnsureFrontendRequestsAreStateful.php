<?php

namespace App\Http\Middleware;

class EnsureFrontendRequestsAreStateful extends \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful
{
    protected function configureSecureCookieSessions(): void
    {
        config([
            // 'session.domain' => '192.168.0.103',
            'session.http_only' => true,
            'session.secure' => (bool) config('session.secure', false),
            'session.same_site' => config('session.same_site', 'lax'),
            // 'session.partitioned' => true,
            // 'session.same_site' => 'none',
        ]);
    }
}
