<?php

namespace App\Traits;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

trait SqlLog
{
    private $path_file_log_sql;

    public function start_log()
    {
        $file = env('SQL_LOG', 'sql_log');
        $this->path_file_log_sql = 'logs/' . $file . '.txt';
        DB::enableQueryLog();
    }

    public function end_log($show = false)
    {
        $log_arr = DB::getQueryLog();
        File::put(storage_path($this->path_file_log_sql), '');

        foreach ($log_arr as $logrr) {
            $date = date('d-m-Y H:i:s');
            $bindings = $logrr['bindings'];
            $query = $logrr['query'];

            foreach ($bindings as $binding) {
                $binding = is_numeric($binding) ? $binding : "'" . addslashes($binding) . "'";
                $query = preg_replace('/\?/', $binding, $query, 1);
            }

            $log = "[" . $date . "] " . $query . "\n";
            $log = str_replace("\"", " ", $log);

            File::append(storage_path($this->path_file_log_sql), "==============================================================\n");
            File::append(storage_path($this->path_file_log_sql), $log);

            if ($show) echo ($log . "<br>");
        }
    }
}
