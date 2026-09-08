<?php

namespace App\Repositories;

use App\Models\SysGroup;
use App\Repositories\BaseRepository;

class SysGroupRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'nama',
        'delete_at'
    ];

    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    public function model(): string
    {
        return SysGroup::class;
    }
}
