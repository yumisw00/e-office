<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\AnalyzeToeBatch;
use App\Jobs\AnalyzeToeNewForm;

// php artisan app:run-toe-batch

class RunToeBatch extends Command
{
    protected $signature = 'app:run-toe-batch';

    protected $description = 'Run TOE AI generate (batch dokumen pendukung)';

    public function handle()
    {
        $rcm_toe = new \App\Models\RcmToe();
        $data_rcm_toe = $rcm_toe
            ->select('id_toe')
            ->where('id_status', '=', 10)
            ->whereNull('generated_ai')
            ->whereNull('status_generate_ai')
            ->get();

        foreach ($data_rcm_toe as $toe) {
            // AnalyzeToeBatch::dispatchSync($toe->id_toe);
            AnalyzeToeNewForm::dispatchSync($toe->id_toe);
        }

        return 1;
    }
}
