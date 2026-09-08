<?php
function listFolderFiles($dir)
{
    $ffs = scandir($dir);

    unset($ffs[array_search('.', $ffs, true)]);
    unset($ffs[array_search('..', $ffs, true)]);

    // prevent empty ordered elements
    if (count($ffs) < 1)
        return;

    //PageDinamic["/risk_profile/id_register/...slug"] = lazy(() => import('pages/(app)/risk_profile/[id_register]/[...slug]/page'));
    foreach ($ffs as $ff) {
        echo $ff;
        // echo "<hr/>";
        if (is_dir($dir . '/' . $ff)) {
            listFolderFiles($dir . '/' . $ff);
        } else if ($ff == "page.jsx" && strstr($dir, "(app)")) {
            $dir = $dir . '/' . $ff;
            $dirindex = str_replace(["./(app)", "[", "]", "/page.jsx"], "", $dir);
            $dirimport = str_replace(["./", ".jsx"], "", $dir);
            // $dirindex = str_replace(,"",$dir);
            echo "<br/>";
            // echo $dir . '/' . $ff;
            echo 'PageDinamic["' . $dirindex . '"] = lazy(() => import("pages/' . $dirimport . '"));';
        } else if (strstr($ff, ".jsx") === false) {
            $dir = str_replace("./", "", $dir) . '/' . $ff;
            if (file_exists($dir)) {
                echo "<br/>";
                echo str_replace("./", "", $dir) . '/' . $ff;
                rename($dir, str_replace(".js", ".jsx", $dir));
            }
        }
    }
}

listFolderFiles('.');
