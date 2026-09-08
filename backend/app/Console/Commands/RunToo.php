<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\DokumenToo;
use App\Traits\SqlLog;

# php artisan app:run-too

# php artisan app:run-too 1 1

class RunToo extends Command
{
    use SqlLog;
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // protected $signature = 'app:run-too {id_rcm_too} {id_rcm}';
    protected $signature = 'app:run-too';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    /*
    public function handle()
    {
        // on_run
        $id_rcm_too = $this->argument('id_rcm_too');
        $id_rcm = $this->argument('id_rcm');
        DokumenToo::dispatchAfterResponse($id_rcm_too, $id_rcm);

        return 1;
    }
    */

    // /*
    public function handle()
    {
        $rcm_csa_too = new \App\Models\RcmCsaToo();
        $rcm_csa_too = $rcm_csa_too
            ->where('is_pilih', '=', 1)
            ->whereNull('on_run')
            // ->where('id_rcm_too', '=', 297)
            // ->where('id_rcm', '=', 28053)
            ->select('id_rcm_too', 'id_rcm');


        // $this->start_log();
        $data_rcm_csa_too = (clone $rcm_csa_too)->get();

        $rcm_csa_too->update(['on_run' => 1]);

        foreach ($data_rcm_csa_too as $value) {
            DokumenToo::dispatchAfterResponse($value->id_rcm_too, $value->id_rcm);
        }

        // $this->end_log();

        return 1;
    }
    // */
}
