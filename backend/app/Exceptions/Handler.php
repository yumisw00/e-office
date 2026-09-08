<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }
    protected function convertExceptionToArray(Throwable $e)
    {
        return config('app.debug') ? [
            "status" => 500,
            "error" => 500,
            'messages' => ['errors' => $e->getMessage()],
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => collect($e->getTrace())->map(fn ($trace) => Arr::except($trace, ['args']))->all(),
        ] : [
            "status" => 500,
            "error" => 500,
            'messages' => ['errors' => $this->isHttpException($e) ? $e->getMessage() : 'Server Error'],
        ];
    }

    protected function invalidJson($request, ValidationException $exception)
    {
        return response()->json([
            'status' => $exception->status,
            'error' => $exception->status,
            'messages' => ['errors' => $exception->getMessage()],
            'errors' => $exception->errors(),
        ], $exception->status);
    }
}
