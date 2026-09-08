<?php

namespace App\Repositories;

use App\Models\SysSetting;
use App\Repositories\BaseRepository;

class SysSettingRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'nama',
        'isi'
    ];

    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    public function model(): string
    {
        return SysSetting::class;
    }
}
