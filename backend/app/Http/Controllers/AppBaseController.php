<?php

namespace App\Http\Controllers;

use App\Utils\ResponseUtil;

/**
 * @OA\Server(url="/api")
 * @OA\Info(
 *   title="InfyOm Laravel Generator APIs",
 *   version="1.0.0"
 * )
 * This class should be parent class for other API controllers
 * Class AppBaseController
 */
class AppBaseController extends Controller
{
    use ResponseUtil;
    public function sendResponse($result, $message)
    {
        return $this->success($result, $message);
    }

    public function sendError($error, $code = 404)
    {
        return $this->fail($error, $code);
    }

    public function sendSuccess($message)
    {
        return $this->success(null, $message);
    }
}
