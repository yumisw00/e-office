<?php

namespace App\Models;

use App\Traits\BeforeSoftDeletes;
use App\Traits\SqlLog;
use App\Services\ImmutableAuditTrailLogger;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Validator;

class BaseModel extends Model
{


    static function getSqlWithBindings1($sql, $bindings)
    {
        return vsprintf(str_replace('?', '%s', $sql), collect($bindings)->map(function ($binding) {
            return $binding === null ? 'null' : (is_numeric($binding) ?  $binding : "'{$binding}'");
        })->toArray());
    }

    function getSqlWithBindings($sql, $bindings)
    {
        return vsprintf(str_replace('?', '%s', $sql), collect($bindings)->map(function ($binding) {
            return $binding === null ? 'null' : (is_numeric($binding) ?  $binding : "'{$binding}'");
        })->toArray());
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

    public function escape($k)
    {
        return trim(DB::escape($k), "'");
    }
    public $orderDefault;
    use SoftDeletes;
    use BeforeSoftDeletes, SqlLog;
    public function search($search)
    {
        $ret = $this;
        if (!empty($search)) {
            foreach ($search as $k => $v) {
                if ($v) {
                    $hasLikeExpression = $this->getLikeExpression($v);
                    if (!is_null($hasLikeExpression)) {
                        $ret = $ret->whereRaw("lower(" . $this->escape($k) . ") like ?", [strtolower($v)]);
                    } else {
                        $ret = $ret->where($k, $v);
                    }
                } else
                    $ret = $ret->where($k, $v);
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

    // /**
    //  * Rec : action, table_name, activity
    //  */

    public function log($aktivitas)
    {
        $this->logging(["activity" => $aktivitas]);
    }
    public function logging($rec = array(), $notArray = null)
    {
        $rec['page'] = URL::current();
        $rec['ip'] = (!empty($_SERVER["REMOTE_ADDR"])) ? $_SERVER["REMOTE_ADDR"] : '';
        $rec['activity_time'] = date("Y-m-d H:i:s");

        // $user_desc = "User";
        // $user_desc .= "#" . (auth()->user() ? auth()->user()->name : null);

        $user_desc = (auth()->user() ? auth()->user()->name : null);
        $rec['user_desc'] = $user_desc;

        if (!$notArray) {
            $rec["data"] = json_encode((array)$rec["data"]);
        }
        // $rec["activity"] = '';

        $log = new \App\Models\SysLog();
        $log->insert($rec);
    }

    // /**
    //  * Inserts data into the current table. If an object is provided,
    //  * it will attempt to convert it to an array.
    //  *
    //  * @param array|object $data
    //  * @param boolean      $returnID Whether insert ID should be returned or not.
    //  *
    //  * @return BaseResult|integer|string|false
    //  * @throws \ReflectionException
    //  */
    public function insert($data = null)
    {
        // $this->formatData($data);
        // $this->setValidationRulesCreated();
        // $this->db->debug = 1;
        // $ret = parent::insert($data, $returnID);

        // if ($this->informationSchemas['created_by']) {
        $data['created_by'] = (auth()->user() ? auth()->user()->id_user : null);
        // }
        // if ($this->informationSchemas['created_by_desc']) {
        $data['created_by_desc'] = (auth()->user() ? auth()->user()->name : null);
        // }
        // var_dump($data);
        // var_dump('============================');
        $ret = $this->create($data)->{$this->primaryKey};
        // $query = $this->db->getLastQuery();
        // echo (string) $query;
        if ($ret) {
            if (is_array($data))
                $data[$this->primaryKey] = $ret;
            else
                $data->{$this->primaryKey} = $ret;

            $this->logging(
                array(
                    "action" => "insert",
                    "table_name" => $this->table,
                    'activity' => 'Menambah data',
                    "data" => $data
                )
            );

            app(ImmutableAuditTrailLogger::class)->log($this->table, $ret, 'insert', null, $data);
        }

        return $ret;
    }


    private function formatData(&$data)
    {
        $data = (array)$data;
        // $data = [];
        // foreach ($this->informationSchemas as $k => $v) {
        //     if (in_array($k, array_keys($temp))) {
        //         $val = $temp[$k];

        //         if (strstr($k, 'is_') && !strstr($k, 'is_', true))
        //             $val = (int)$val;

        //         if ($v['type'] == 'integer') {
        //             if ($val === '') {
        //                 if ($this->validationRules[$k]) {
        //                     if (strstr($this->validationRules[$k], "required") === false)
        //                         unset($this->validationRules[$k]);
        //                 }

        //                 $val = null;
        //             } else
        //                 $val = (int)$val;
        //         }

        //         if ($v['type'] == 'date') {
        //             if ($val === '') {
        //                 if ($this->validationRules[$k]) {
        //                     if (strstr($this->validationRules[$k], "required") === false)
        //                         unset($this->validationRules[$k]);
        //                 }

        //                 $val = null;
        //             }
        //         }

        //         if ($v['type'] == 'decimal') {
        //             $val = (float)$val;
        //         }

        //         $data[$k] = $val;
        //     } else {
        //         if (($v['type'] == 'integer' || $v['type'] == 'decimal') && $this->validationRules[$k]) {
        //             if (strstr($this->validationRules[$k], "required") === false)
        //                 unset($this->validationRules[$k]);
        //         }
        //     }
        // }

        if ($data[$this->primaryKey]) {
            // unset($data['created_date']);
            // unset($data['created_by']);
            // unset($data['created_by_desc']);
            // if ($this->informationSchemas['updated_date']) {
            //     $data['updated_date'] = date("Y-m-d H:i:s");
            // }
            if ($this->informationSchemas['updated_by']) {
                $data['updated_by'] = (auth()->user() ? auth()->user()->id_user : null);
            }
            if ($this->informationSchemas['updated_by_desc']) {
                $data['updated_by_desc'] = (auth()->user() ? auth()->user()->name : null);
            }
        } else {
            // unset($data['updated_date']);
            // unset($data['updated_by']);
            // unset($data['updated_by_desc']);
            // if ($this->informationSchemas['created_date']) {
            //     $data['created_date'] = date("Y-m-d H:i:s");
            // }
            if ($this->informationSchemas['created_by']) {
                $data['created_by'] = (auth()->user() ? auth()->user()->id_user : null);
            }
            if ($this->informationSchemas['created_by_desc']) {
                $data['created_by_desc'] = (auth()->user() ? auth()->user()->name : null);
            }
        }
    }

    public function delete($id = null, bool $purge = false, $data = [])
    {
        // if (!$data) {
        //     $data = $this->find($id);
        //     if (!$data)
        //         return false;
        // }


        // // if ($this->informationSchemas['created_by']) {
        // $data['deleted_by'] = (auth()->user() ? auth()->user()->id_user : null);
        // // }
        // // if ($this->informationSchemas['created_by_desc']) {
        // $data['deleted_by_desc'] = (auth()->user() ? auth()->user()->name : null);
        // }

        // $this->formatData($data);

        // $ret = $this->hasMany(\App\Models\RcmUnit::class, 'id_deskripsi_lokasi');

        // $this->start_log();
        list($ret, $msg) = $this->before_delete($this->table, $this->{$this->primaryKey});
        // $this->end_log();
        if ($ret)
            return false;

        $oldValues = $this->toArray();
        $recordId = $this->{$this->primaryKey};

        $ret = parent::delete($id, $purge);
        // var_dump($ret);
        if ($ret) {
            app(ImmutableAuditTrailLogger::class)->log($this->table, $recordId, 'delete', $oldValues, null);
            // if (is_array($data))
            //     $data[$this->primaryKey] = $id;
            // else
            //     $data->{$this->primaryKey} = $id;

            // $this->logging(
            //     array(
            //         "action" => "delete",
            //         "table_name" => $this->table,
            //         "activity" => $data
            //     )
            // );
        }

        return $ret;
    }

    protected function runSoftDelete()
    {
        $query = $this->setKeysForSaveQuery($this->newModelQuery());

        $time = $this->freshTimestamp();

        $columns = [$this->getDeletedAtColumn() => $this->fromDateTime($time)];

        $this->{$this->getDeletedAtColumn()} = $time;

        if ($this->usesTimestamps() && !is_null($this->getUpdatedAtColumn())) {
            $this->{$this->getUpdatedAtColumn()} = $time;

            $columns[$this->getUpdatedAtColumn()] = $this->fromDateTime($time);
        }

        $columns['deleted_by'] = (auth()->user() ? auth()->user()->id_user : null);
        $columns['deleted_by_desc'] = (auth()->user() ? auth()->user()->name : null);

        $query->update($columns);

        $this->syncOriginalAttributes(array_keys($columns));

        $this->fireModelEvent('trashed', false);
    }

    // /**
    //  * Updates a single record in $this->table. If an object is provided,
    //  * it will attempt to convert it into an array.
    //  *
    //  * @param integer|array|string $id
    //  * @param array|object         $data
    //  *
    //  * @return boolean
    //  * @throws \ReflectionException
    //  */
    public function update($id = null, $data = null, $data_before = []): bool
    {
        if (!$id)
            return false;

        if (!$data_before && $id) {
            // print_r($id);
            $data_before = $this->where($this->primaryKey, $id)->first();
            // print_r( DB::getQueryLog());
            // print_r($data_before);
            if (!$data_before)
                return false;
        }

        foreach ($data as $colom => $value) {
            if (!in_array($colom, $this->fillable)) {
                unset($data[$colom]);
            }
        }

        // Audit ownership must describe the authenticated actor, not a value
        // supplied by a client during a generic resource update.
        unset(
            $data['created_by'],
            $data['created_by_desc'],
            $data['updated_by'],
            $data['updated_by_desc'],
            $data['deleted_by'],
            $data['deleted_by_desc']
        );
        // if ($this->informationSchemas['updated_by']) {
        $data['updated_by'] = (auth()->user() ? auth()->user()->id_user : null);
        // }
        // if ($this->informationSchemas['updated_by_desc']) {
        $data['updated_by_desc'] = (auth()->user() ? auth()->user()->name : null);
        // }
        // $this->formatData($data);
        // $this->setValidationRulesUpdated($data);
        $ret = $this->where($this->primaryKey, $id)->update($data);

        if ($ret) {
            $this->logging(
                array(
                    "action" => "update",
                    "table_name" => $this->table,
                    'activity' => 'Mengubah data',
                    "data" => [
                        "before" => $data_before,
                        "after" => $data
                    ]
                )
            );

            app(ImmutableAuditTrailLogger::class)->log($this->table, $id, 'update', $data_before, $data);
        }

        return $ret;
    }

    public function validate(array $data)
    {
        return Validator::make($data, $this->rules);
    }

    public function get_table_scema()
    {
        if ($this->table)
            return DB::select("
                select
                    column_name,
                    data_type
                from
                    information_schema.columns
                where
                    table_name = ?", [$this->table]);
        else return false;
    }

    # only for copy tod
    public function set_data(array $data, $add = [])
    {
        foreach ($data as $key => $value) {
            if (in_array($key, $this->escape_copy))
                unset($data[$key]);
        }

        if ($data && $add)
            return array_merge($data, $add);
        else if (!$data && $add)
            return $add;
        else
            return $data;
    }
}
