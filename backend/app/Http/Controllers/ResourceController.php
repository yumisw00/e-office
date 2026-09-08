<?php

namespace App\Http\Controllers;

use App\Traits\SqlLog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Utils\ResponseUtil;

class ResourceController extends BaseController
{
	use AuthorizesRequests, ValidatesRequests, ResponseUtil, SqlLog;

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
	
	protected $model;
}
