<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Cookie\CookieValuePrefix;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
        '/api/upload',
        '/logout',
        '/loginAs',
    ];

    protected function getTokenFromRequest($request)
    {
        $token = $request->input('_token') ?: $request->cookie("XSRF-TOKEN");

        if (!$token && $header = $request->cookie("XSRF-TOKEN")) {
            try {
                $token = CookieValuePrefix::remove($this->encrypter->decrypt($header, static::serialized()));
            } catch (DecryptException) {
                $token = '';
            }
        }

        // echo $header;

        return $token;
    }
}
