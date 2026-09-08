<?php

namespace App\Providers;

use App\Models\SuratKeluar;
use App\Models\SysPersonalAccessToken;
use App\Models\SysUser;
use App\Observers\SuratKeluarObserver;
use App\Policies\SysUserPolicy;
use App\Sessions\DatabaseSessionHandler;
use App\Sessions\SessionGuard;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }


    /*
    function getSqlWithBindings($query)
    {
        return vsprintf(str_replace('?', '%s', $query->sql), collect($query->bindings)->map(function ($binding) {
            return $binding === null ? 'null' : (is_numeric($binding) ?  $binding : "'{$binding}'");
        })->toArray());
    }
    */

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Keep surat_masuk status in sync with surat_keluar workflow
        SuratKeluar::observe(SuratKeluarObserver::class);
        /*

        // file_put_contents('php://stdout', "tes\n");
        DB::listen(function ($query) {
            $sql = $this->getSqlWithBindings($query);
            $time = $query->time;
            file_put_contents('php://stdout', "[SQL]" . date("Y-m-d H:i:s") . " " . str_replace(["\n", "\t"], "", $sql) . " \n" .
                "      Time:\t{$time} milliseconds\n");
        });
        // Gate::policy(SysUser::class, SysUserPolicy::class);

        //custom
        Sanctum::usePersonalAccessTokenModel(SysPersonalAccessToken::class);

        // Auth::extend('session', function (Application $app) {
        //     return new SessionGuard();
        // });

        Session::extend('database', function (Application $app) {
            $table = $app->config->get('session.table');
            $lifetime = $app->config->get('session.lifetime');
            $connection = $app->config->get('session.connection');

            return new DatabaseSessionHandler(
                $app->make('db')->connection($connection),
                $table,
                $lifetime,
                $app
            );
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });
        */

        /*
        // Log sql to artisan
        DB::listen(function ($query) {
            $sql = $this->getSqlWithBindings($query);
            if (strstr($sql, 'risk_register') !== false) {
                $time = $query->time;
                file_put_contents('php://stdout', "[SQL]" . date("Y-m-d H:i:s") . " " . str_replace(["\n", "\t"], "", $sql) . " \n" .
                    // "      bindings:\t" . json_encode($bindings) . "\n" .
                    "      Time:\t{$time} milliseconds\n");
            }
        });

        DB::listen(function ($query) {
            $sql = $this->getSqlWithBindings($query);
            $time = $query->time;
            file_put_contents('php://stdout', "[SQL]" . date("Y-m-d H:i:s") . " " . str_replace(["\n", "\t"], "", $sql) . " \n" .
                "      Time:\t{$time} milliseconds\n");
        });
        */

        /*
        DB::listen(function ($query) {
            $sql = $this->getSqlWithBindings($query);

            // Contoh filter, hanya log query yg mengandung 'risk_register'
            // if (strstr($sql, 'risk_register') !== false) {
            $log = "[" . date('Y-m-d H:i:s') . "] ";
            $log .= str_replace(["\n", "\t"], " ", $sql);
            $log .= " | Time: {$query->time} ms\n";

            // Append log ke file storage/logs/sql_log.txt
            File::append(storage_path('logs/sql_log.txt'), $log);
            // }
        });
        */
    }
}
