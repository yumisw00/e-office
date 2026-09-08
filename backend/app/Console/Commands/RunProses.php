<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\AnalyzeProses;
use App\Traits\SqlLog;

# php artisan app:run-proses

class RunProses extends Command
{
    use SqlLog;
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:run-proses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */

    public function handle()
    {
        $mt_proses = new \App\Models\MtProses();

        $id_proses = $mt_proses
            ->join('mt_proses_files', 'mt_proses_files.id_proses', '=', 'mt_proses.id_proses')
            ->whereNotExists(function ($query) {
                $query
                    ->selectRaw("1")
                    ->from("mt_proses_description")
                    ->whereColumn("mt_proses.id_proses", "mt_proses_description.id_proses");
            })
            ->whereNull('mt_proses_files.deleted_at')
            ->pluck('mt_proses.id_proses');
        #

        foreach ($id_proses as $id) {
            AnalyzeProses::dispatchSync($id);
        }
    }
}
