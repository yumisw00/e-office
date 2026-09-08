<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\AnalyzeTod;
use App\Traits\SqlLog;

# php artisan app:run-tod

# php artisan app:run-tod 1 1

class RunTod extends Command
{
    use SqlLog;
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // protected $signature = 'app:run-tod {id_rcm_tod} {id_rcm}';
    protected $signature = 'app:run-tod';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */

    // /*
    public function handle()
    {
        $rcm_csa_tod = new \App\Models\RcmCsaTod();
        $rcm_csa_tod = $rcm_csa_tod
            ->where('is_pilih', '=', 1)
            ->whereNull('on_run')
            // ->where('id_rcm_tod', '=', 297)
            // ->where('id_rcm', '=', 28053)
            ->select('id_tod', 'id_rcm');


        // $this->start_log();
        $data_rcm_csa_tod = (clone $rcm_csa_tod)->get();


        $rcm_csa_tod->update(['on_run' => 1]);

        foreach ($data_rcm_csa_tod as $value) {
            AnalyzeTod::dispatchAfterResponse($value->id_rcm_tod, $value->id_rcm);
            // AnalyzeTod::dispatchSync($value->id_tod, $value->id_rcm);
        }
        // $this->end_log();

        return 1;
    }
    // */
}
