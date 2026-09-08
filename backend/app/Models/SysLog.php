<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class SysLog extends Model
{
    public $orderDefault = "id_log desc";
    use SoftDeletes;

    // === CONSTANTS UNTUK LOGIN ACTION ===
    const ACTION_LOGIN_SUCCESS = 'login_success';
    const ACTION_LOGIN_FAILED = 'login_failed';
    const ACTION_LOGOUT = 'logout';
    const ACTION_PASSWORD_CHANGED = 'password_changed';
    const ACTION_PASSWORD_RESET = 'password_reset';
    const ACTION_PASSWORD_FORGOT_REQUEST = 'password_forgot_request';
    const ACTION_SECURITY_INCIDENT = 'security_incident';
    const ACTION_ACCOUNT_LOCKED = 'account_locked';
    const ACTION_ACCOUNT_UNLOCKED = 'account_unlocked';
    const ACTION_FORCE_PASSWORD_CHANGE = 'force_password_change';
    const ACTION_2FA_ENABLED = '2fa_enabled';
    const ACTION_2FA_DISABLED = '2fa_disabled';

    public function escape($k)
    {
        return trim(DB::escape($k), "'");
    }
    public function search($search)
    {
        $ret = $this;
        if (!empty($search)) {
            foreach ($search as $k => $v) {
                $hasLikeExpression = $this->getLikeExpression($v);
                if (!is_null($hasLikeExpression)) {
                    $ret = $ret->whereRaw("lower(" . $this->escape($k) . ") like ?", [strtolower($v)]);
                } else {
                    $ret = $ret->where($k, $v);
                }
            }
        }

        return $ret;
    }

    private function getLikeExpression(String $value)
    {
        $position = 0;
        $firstCharacter = substr($value, 0, 1) == '%' ? 1 : 0;
        $endCharacter = substr($value, -1, 1) == '%' ? 2 : 0;
        $position = $position + $firstCharacter + $endCharacter;
        switch ($position) {
            case 1:
                return 'before';
                break;
            case 2:
                return 'after';
                break;
            case 3:
                return 'both';
                break;
            default:
                return null;
        }
    }

    public $table = 'sys_log';

    public $primaryKey = 'id_log';

    public $fillable = [
        'page',
        'activity',
        'data',
        'ip',
        'user_agent',
        'login_device',
        'login_os',
        'login_browser',
        'activity_time',
        'user_desc',
        'action',
        'table_name',
        'created_by',
        'modified_by',
        'created_by_desc',
        'modified_by_desc',
        'deleted_by',
        'deleted_by_desc'
    ];

    public $casts = [
        'page' => 'string',
        'activity' => 'string',
        'ip' => 'string',
        'user_agent' => 'string',
        'login_device' => 'string',
        'login_os' => 'string',
        'login_browser' => 'string',
        'activity_time' => 'datetime',
        'user_desc' => 'string',
        'action' => 'string',
        'table_name' => 'string',
        'created_by_desc' => 'string',
        'modified_by_desc' => 'string',
        'deleted_by_desc' => 'string'
    ];

    public array $rules = [
        'page' => 'nullable|string|max:500',
        'activity' => 'nullable|string',
        'ip' => 'nullable|string|max:50',
        'user_agent' => 'nullable|string|max:500',
        'login_device' => 'nullable|string|max:100',
        'login_os' => 'nullable|string|max:50',
        'login_browser' => 'nullable|string|max:50',
        'activity_time' => 'nullable',
        'user_desc' => 'nullable|string|max:200',
        'action' => 'nullable|string|max:50',
        'table_name' => 'nullable|string|max:100',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'created_by' => 'nullable',
        'modified_by' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'modified_by_desc' => 'nullable|string|max:200',
        'deleted_at' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200'
    ];

    /**
     * Static helper untuk logging login
     */
    public static function logLoginAttempt(array $data): self
    {
        $log = new self();
        $log->action = $data['action'];
        $log->activity = $data['activity'];
        $log->ip = $data['ip'] ?? request()->ip();
        $log->user_agent = $data['user_agent'] ?? request()->userAgent();
        $log->user_desc = $data['user_desc'] ?? null;
        $log->login_device = $data['login_device'] ?? null;
        $log->login_os = $data['login_os'] ?? null;
        $log->login_browser = $data['login_browser'] ?? null;
        $log->data = json_encode($data['data'] ?? []);
        $log->activity_time = now();
        $log->page = URL::current();
        $log->save();

        return $log;
    }
}