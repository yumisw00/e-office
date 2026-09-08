<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\AnalyzeToe;
use App\Traits\SqlLog;

# php artisan app:run-toe

# php artisan app:run-toe 1 1

class RunToe extends Command
{
    use SqlLog;
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // protected $signature = 'app:run-toe {id_rcm_toe} {id_rcm}';
    protected $signature = 'app:run-toe';

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
        $rcm_toe = new \App\Models\RcmToe();

        $data_rcm_toe = $rcm_toe->whereNull('generated_ai')->get();
        foreach ($data_rcm_toe as $toe) {
            AnalyzeToe::dispatchAfterResponse($toe->id_toe);
            // AnalyzeToe::dispatchSync($toe->id_toe);
        }

        return 1;

        /*
        $rcm_csa_toe = new \App\Models\RcmCsaTod();
        $rcm_csa_toe = $rcm_csa_toe
            ->where('is_pilih', '=', 1)
            ->whereNull('on_run')
            // ->where('id_rcm_toe', '=', 297)
            // ->where('id_rcm', '=', 28053)
            ->select('id_toe', 'id_rcm');


        $this->start_log();
        $data_rcm_csa_toe = (clone $rcm_csa_toe)->get();


        $rcm_csa_toe->update(['on_run' => 1]);

        foreach ($data_rcm_csa_toe as $value) {
            // DokumenTod::dispatchAfterResponse($value->id_rcm_toe, $value->id_rcm);
            AnalyzeTod::dispatchSync($value->id_toe, $value->id_rcm);
        }
        $this->end_log();

        return 1;
        */
    }
    // */
}
