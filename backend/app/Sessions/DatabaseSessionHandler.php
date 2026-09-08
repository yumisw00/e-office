<?php

namespace App\Sessions;

use Illuminate\Session\DatabaseSessionHandler as SessionDatabaseSessionHandler;
use Illuminate\Contracts\Auth\Guard;

class DatabaseSessionHandler extends SessionDatabaseSessionHandler
{
    protected function addUserInformation(&$payload)
    {
        if ($this->container->bound(Guard::class)) {
            $payload['id_user'] = $this->userId();
        }

        return $this;
    }
}
