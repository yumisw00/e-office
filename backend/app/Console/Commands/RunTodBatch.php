<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Jobs\AnalyzeTodBatch;
use App\Jobs\AnalyzeTodNewForm;
use App\Traits\SqlLog;

// php artisan app:run-tod-batch

class RunTodBatch extends Command
{
    use SqlLog;
    protected $signature = 'app:run-tod-batch';

    protected $description = 'Run TOD AI generate (batch dokumen pendukung)';

    private function claimTodRows()
    {
        $rcm_tod = new \App\Models\RcmTod();
        $periode = new \App\Models\Periode();

        $y = date('Y');
        $id_periode_list = (clone $periode)
            ->sql_id_periode_belum_terlewat_tgl_selesai(['toe'], null, $y)
            ->select('id_periode');

        $id_rcm_tod = $rcm_tod
            ->where('id_status', '=', 10)
            ->whereIn('id_periode', $id_periode_list)
            ->select('id_tod');

        $rcm_csa_tod = new \App\Models\RcmCsaTod();

        return DB::transaction(function () use ($rcm_csa_tod, $id_rcm_tod) {
            $rows = $rcm_csa_tod
                ->newQuery()
                ->whereIn('id_tod', $id_rcm_tod)
                ->where('is_pilih', '=', 1)
                ->whereNull('on_run')
                ->select('id_csa_tod', 'id_tod', 'id_rcm')
                ->lockForUpdate()
                ->get();

            if ($rows->isEmpty()) {
                return $rows;
            }

            $rcm_csa_tod
                ->newQuery()
                ->whereIn('id_csa_tod', $rows->pluck('id_csa_tod')->all())
                ->update(['on_run' => 1]);

            return $rows;
        });
    }

    public function handle()
    {
        $data_rcm_csa_tod = $this->claimTodRows();

        foreach ($data_rcm_csa_tod as $value) {
            // AnalyzeTodBatch::dispatchSync($value->id_tod, $value->id_rcm, true);
            AnalyzeTodNewForm::dispatchSync($value->id_tod, $value->id_rcm, true);
        }

        return 1;
    }
}
