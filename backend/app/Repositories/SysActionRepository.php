<?php

namespace App\Repositories;

use App\Models\SysAction;
use App\Repositories\BaseRepository;

class SysActionRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'nama',
        'id_menu'
    ];

    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    public function model(): string
    {
        return SysAction::class;
    }
}
