<?php

namespace App\Console\Commands;

use Illuminate\Support\Facades\DB;
use Illuminate\Console\Command;
use App\Jobs\DokumenTooBatch;
use App\Jobs\DokumenTooNewForm;
use App\Traits\SqlLog;

// php artisan app:run-too-batch

class RunTooBatch extends Command
{
    use SqlLog;
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:run-too-batch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run TOO AI generate (batch dokumen pendukung)';

    private function claimTooRows()
    {
        $rcm_too = new \App\Models\RcmToo();
        $periode = new \App\Models\Periode();

        $y = date('Y');
        $id_periode_list = (clone $periode)
            ->sql_id_periode_belum_terlewat_tgl_selesai(['tod'], null, $y)
            ->select('id_periode');

        $id_rcm_too = $rcm_too->select('id_rcm_too')->where('id_status', '=', 20)->whereIn('id_periode', $id_periode_list);

        $rcm_csa_too = new \App\Models\RcmCsaToo();

        return DB::transaction(function () use ($rcm_csa_too, $id_rcm_too) {
            $rows = $rcm_csa_too
                ->newQuery()
                ->whereIn('id_rcm_too', $id_rcm_too)
                ->where('is_pilih', '=', 1)
                ->whereNull('on_run')
                ->select('id_csa_too', 'id_rcm_too', 'id_rcm')
                ->lockForUpdate()
                ->get();
            return $rows;

            if ($rows->isEmpty()) {
                return $rows;
            }

            $rcm_csa_too
                ->newQuery()
                ->whereIn('id_csa_too', $rows->pluck('id_csa_too')->all())
                ->update(['on_run' => 1]);

            return $rows;
        });
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $data_rcm_csa_too = $this->claimTooRows();

        foreach ($data_rcm_csa_too as $value) {
            // DokumenTooBatch::dispatchSync($value->id_rcm_too, $value->id_rcm);
            DokumenTooNewForm::dispatchSync($value->id_rcm_too, $value->id_rcm);
        }

        // $this->end_log();
        // DB::rollBack();
        return 1;
    }
}
