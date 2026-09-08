<?php

namespace App\Traits;

use ErrorException;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

trait BeforeSoftDeletes
{
    private $koneksiarr;
    private $pk;

    public function before_delete(string $table, $pk): array
    {
        $this->pk = $pk;
        $ret = false;
        $msg = "";

        $this->koneksi($table);

        if (count($this->koneksiarr) == 0)
            return [$ret, $msg];

        list($ret, $table) = $this->test_koneksi();

        if ($ret) {
            $msg = "Data digunakan pada " . $table;
            throw new ErrorException($msg);
        }

        return [$ret, $msg];
    }

    private function koneksi($table)
    {

        $this->koneksiarr = DB::select("
        select 
			distinct
                kcu.table_name as table,
                kcu.column_name as colom
        from information_schema.table_constraints tco
        join information_schema.key_column_usage kcu
                  on tco.constraint_schema = kcu.constraint_schema
                  and tco.constraint_name = kcu.constraint_name
        join information_schema.referential_constraints rco
                  on tco.constraint_schema = rco.constraint_schema
                  and tco.constraint_name = rco.constraint_name
        join information_schema.table_constraints rel_tco
                  on rco.unique_constraint_schema = rel_tco.constraint_schema
                  and rco.unique_constraint_name = rel_tco.constraint_name
        join information_schema.key_column_usage kcupk
                  on rel_tco.constraint_schema = kcupk.constraint_schema
                  and rel_tco.constraint_name = kcupk.constraint_name
        where tco.constraint_type = 'FOREIGN KEY' and rel_tco.table_schema = 'public' and rel_tco.table_name = ?
        ", [$table]);

        // die;
    }

    private function test_koneksi()
    {

        $ret = false;
        $table = "";
        $colom = "";

        foreach ($this->koneksiarr as $koneksi) {
            if ($ret)
                break;

            $table = $koneksi->table;
            $colom = $koneksi->colom;

            $ret = DB::table($table)->where($colom, '=', $this->pk)->whereNull('deleted_at')->get()->count();

            if ($ret)
                $ret = true;
        }

        return [$ret, $table];
    }
}
