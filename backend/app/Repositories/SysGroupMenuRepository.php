<?php

namespace App\Repositories;

use App\Models\SysGroupMenu;
use App\Repositories\BaseRepository;

class SysGroupMenuRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'id_group',
        'id_menu'
    ];

    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    public function model(): string
    {
        return SysGroupMenu::class;
    }
}
