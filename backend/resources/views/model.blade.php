@php
    echo "<?php".PHP_EOL;
@endphp

namespace {{ $config->namespaces->model }};

use Illuminate\Database\Eloquent\Model;
@if($config->options->softDelete) {{ 'use Illuminate\Database\Eloquent\SoftDeletes;' }}@endif
@if($config->options->tests or $config->options->factory) {{ 'use Illuminate\Database\Eloquent\Factories\HasFactory;' }}@endif

@if(isset($swaggerDocs)){!! $swaggerDocs  !!}@endif
class {{ $config->modelNames->name }} extends BaseModel
{
@if($config->options->softDelete) {{ infy_tab().'use SoftDeletes;' }}@endif
@if($config->options->tests or $config->options->factory){{ infy_tab().'use HasFactory;' }}@endif
    public $table = '{{ $config->tableName }}';

@if($customPrimaryKey)@tab()public $primaryKey = '{{ $customPrimaryKey }}';@nls(2)@endif
@if($config->connection)@tab()protected $connection = '{{ $config->connection }}';@nls(2)@endif
@if(!$timestamps)@tab()public $timestamps = false;@nls(2)@endif
@if($customSoftDelete)@tab()protected $dates = ['{{ $customSoftDelete }}'];@nls(2)@endif
@if($customCreatedAt)@tab()const CREATED_AT = '{{ $customCreatedAt }}';@nls(2)@endif
@if($customUpdatedAt)@tab()const UPDATED_AT = '{{ $customUpdatedAt }}';@nls(2)@endif
    public $fillable = [
        {!! $fillables !!}
    ];

    protected $casts = [
        {!! $casts !!}
    ];

    public array $rules = [
        {!! $rules !!}
    ];

    {!! $relations !!}
}
