<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurityPolicy
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $cspRules = "default-src 'self'; script-src 'self' " . env('APP_URL') . "; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";

        $response->headers->set('Content-Security-Policy', $cspRules);

        return $response;
    }
}
