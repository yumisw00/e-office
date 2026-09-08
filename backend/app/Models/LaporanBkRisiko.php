<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LaporanBkRisiko extends BaseModel
{
    public $table = 'laporan_bk_risiko';

    public $primaryKey = 'id';

    public $fillable = [
        'a'
    ];

    public $casts = [
        'a' => 'string'
    ];

    public array $rules = [
        'a' => 'nullable|string'
    ];

    
}
