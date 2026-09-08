<?php

namespace App\Console\Commands;

use App\Http\Controllers\API\CronTab;
use Illuminate\Console\Command;

class RcmCsaTelatCron extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:rcm-csa-telat-cron';

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
        $crontab = new CronTab;

        # telat csa
        $response = $crontab->rcm_csa_telat();
        $ret = (!empty($response->getData()->success)) ? true : false;
        if ($ret)
            $this->info(date('d-m-Y H:i:s') . ' ' . 'RCM CSA Telat executed');
        else {
            $this->error(date('d-m-Y H:i:s') . ' ' . 'RCM CSA Telat fail');
            return 0;
        }

        # telat remediasi
        $response = $crontab->rcm_remediasi_telat();
        $ret = (!empty($response->getData()->success)) ? true : false;
        if ($ret)
            $this->info(date('d-m-Y H:i:s') . ' ' . 'Remediasi Telat executed');
        else {
            $this->error(date('d-m-Y H:i:s') . ' ' . 'Remediasi Telat fail');
            return 0;
        }
        /*
        var_dump(json_encode($response->getData()));
        */
        // $this->info('RCM CSA Telat executed: ' . json_encode($response->getData()));
    }
}
