<?php

namespace App\Repositories;

use App\Models\SysMenu;
use App\Repositories\BaseRepository;

class SysMenuRepository extends BaseRepository
{
    protected $fieldSearchable = [
        'id_parent_menu',
        'nama',
        'url',
        'sort',
        'icon',
        'is_show'
    ];

    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    public function model(): string
    {
        return SysMenu::class;
    }
}
