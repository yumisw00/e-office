<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function getFKsTo($table) {
    return DB::select("
        select
            distinct
            kcu.table_name as tbl,
            kcu.column_name as col
        from information_schema.table_constraints tco
        join information_schema.key_column_usage kcu
                  on tco.constraint_schema = kcu.constraint_schema
                  and tco.constraint_name = kcu.constraint_name
        join information_schema.referential_constraints rco
                  on tco.constraint_schema = rco.constraint_schema
                  and tco.constraint_name = rco.constraint_name
        join information_schema.table_constraints rel_tco
                  on rco.unique_constraint_schema = rel_tco.constraint_schema
                  and rco.unique_constraint_name = rel_tco.constraint_name
        join information_schema.key_column_usage kcupk
                  on rel_tco.constraint_schema = kcupk.constraint_schema
                  and rel_tco.constraint_name = kcupk.constraint_name
        where tco.constraint_type = 'FOREIGN KEY' and rel_tco.table_schema = 'public' and rel_tco.table_name = ?
    ", [$table]);
}

foreach (['mt_sdm_divisi', 'mt_sdm_departemen', 'mt_sdm_unit'] as $t) {
    $rows = getFKsTo($t);
    echo "=== Tables with FK -> $t ===\n";
    if (empty($rows)) {
        echo "  (none)\n";
    } else {
        foreach ($rows as $r) {
            echo "  {$r->tbl}.{$r->col}\n";
        }
    }
}

echo "\nDone.\n";
