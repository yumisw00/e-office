<?php
$rowspan = count($header);
$level = 0;
$retstr = [];
if(@$_GET['debug']){
    echo "<pre>";
    print_r($header);
    echo "</pre>";
}
// sort($header);
foreach ($header as $level => $r) {
    $html1 = "<tr key='" . $level . "'>";
    // $level++;
    foreach ($r as $keycolumn => $r1) {
        $span = "";
        if (isset($r1['cols']) && $r1['cols'])
            $span = "colspan='" . $r1['cols'] . "' ";
        else if (($rowspan - $level) > 1)
            $span = "rowspan='" . $rowspan - $level . "' ";

        $html1 .= "<th $span style='background-color:#2b2a4c;border:1pt solid #dee2e6;color:#ffffff;'>";
        $html1 .= $r1['label'];
        $html1 .= "</th>";
    }
    $html1 .= "</tr>";

    $retstr[$level] = $html1;
}
sort($retstr);
// dump($cols);
// echo "<pre>";
// // var_dump($rows);
// print_r($rows);
// return;
?>
<style>
    @font-face {
        font-family: "aptos";
        src: url("../../font/aptos.ttf");
    }

    * {
        font-family: aptos;
    }
</style>

<div>

    <h4 style="text-align: center; margin-bottom: 0px;"><?= $title ?></h5>
        <h4 style="text-align: center; margin-top: 0px;"><?= $tahun ?></h4>
        <?php if (isset($nama_register)) { ?>
            <h4 style="margin: 0px;">Risk Owner : <?= $nama_register ?></h4>
        <?php } ?>
        <table style="width: 100%;">
            <thead>
                <?= implode("", $retstr) ?>
            </thead>
            <tbody>
                <?php
                $totalKolom = 0;
                $total_mitigasi_biaya = 0;
                $total_res_nilai_dampakq4 = 0;
                $total_res_eksposur_dampakq4 = 0;
                $total_nilai_dampak_inheren = 0;
                $total_eksposur_risiko = 0;

                #ambil kolom yang akan di beri total
                foreach ($cols as $keyColumn => $column1) {

                    # Template Rencana Perlakuan Risiko
                    if ($column1 == 'mitigasi_biaya') {
                        $key_col_mitigasi_biaya = $keyColumn;
                    }

                    # Template Analisa Risiko Residual
                    if ($column1 == 'res_nilai_dampakq4') {
                        $key_col_res_nilai_dampakq4 = $keyColumn;
                    }
                    if ($column1 == 'res_eksposur_risikoq4') {
                        $key_col_res_eksposur_dampakq4 = $keyColumn;
                    }

                    #template Analisa Risiko Inheren
                    if ($column1 == 'nilai_dampak_inheren') {
                        $key_col_nilai_dampak_inheren = $keyColumn;
                    }
                    if ($column1 == 'eksposur_risiko') {
                        $key_col_eksposur_risiko = $keyColumn;
                    }
                }

                foreach ($rows as $rws) {
                    $k = 0;
                    $cr = count($rws);
                    $ck = [];
                    foreach ($rws as $r) {
                        foreach ($r as $k => $v) {
                            if (!isset($ck[$k]))
                                $ck[$k] = 0;
                            else
                                $ck[$k]++;
                        }
                    }
                    $i = 0;
                    $ic = [];
                    foreach ($rws as $r) {

                        # ambil jumlah data kolom yang akan di total
                        # Template Rencana Perlakuan Risiko
                        if (isset($r['mitigasi_biaya']) && is_numeric($r['mitigasi_biaya'])) {
                            $total_mitigasi_biaya += $r['mitigasi_biaya'];
                        }
                        # Template Analisa Risiko Residual
                        if (isset($r['res_nilai_dampakq4']) && is_numeric($r['res_nilai_dampakq4'])) {
                            $total_res_nilai_dampakq4 += $r['res_nilai_dampakq4'];
                        }
                        if (isset($r['res_eksposur_risikoq4']) && is_numeric($r['res_eksposur_risikoq4'])) {
                            $total_res_eksposur_dampakq4 += $r['res_eksposur_risikoq4'];
                        }

                        #template Analisa Risiko Inheren 
                        if (isset($r['nilai_dampak_inheren']) && is_numeric($r['nilai_dampak_inheren'])) {
                            $total_nilai_dampak_inheren += $r['nilai_dampak_inheren'];
                        }
                        if (isset($r['eksposur_risiko']) && is_numeric($r['eksposur_risiko'])) {
                            $total_eksposur_risiko += $r['eksposur_risiko'];
                        }

                ?>
                        <tr>
                            <?php
                            foreach ($cols as $column) {
                                if (!isset($ic[$column]))
                                    $ic[$column] = 0;
                                else
                                    $ic[$column]++;

                                $rowspan = 1;
                                if (!isset($ck[$column])) { ?>
                                    <!-- <td style='border:1pt solid #dee2e6;' rowspan="<?= $rowspan > 1 ? $rowspan : null ?>"> -->
                                    <!-- <i><?= $column ?></i> -->
                                    <!-- </td> -->
                                    <?php } else {
                                    if ($ic[$column] == $ck[$column])
                                        $rowspan = $cr - $ck[$column];

                                    if (in_array($column, array_keys($r))) {
                                        if (isset($header_type[$column]) && $header_type[$column] == 'rupiah') {
                                    ?>

                                            <td style='border:1pt solid #dee2e6; text-align:right;' rowspan="<?= $rowspan > 1 ? $rowspan : null ?>">
                                                <?= rupiah($r[$column]) ?>
                                            </td>
                                        <?php } elseif (!empty($cols_color) && in_array($column . '_warna', $cols_color) && isset($r[$column . '_warna'])) { ?>
                                            <td style='border:1pt solid #dee2e6;background-color: <?= $r[$column . '_warna'] ?>;text-align: center;' rowspan="<?= $rowspan > 1 ? $rowspan : null ?>">
                                                <?= $r[$column] ?>
                                            </td>
                                        <?php } else { ?>
                                            <td style='border:1pt solid #dee2e6;' rowspan="<?= $rowspan > 1 ? $rowspan : null ?>">
                                                <?= $r[$column] ?>
                                            </td>
                            <?php }
                                    }
                                }
                            } ?>
                        </tr>
                <?php $i++;
                    }
                } ?>

                <!-- munculkan total -->
                <!-- # Template Rencana Perlakuan Risiko -->
                <?php if (isset($key_col_mitigasi_biaya)) { ?>
                    <tr>
                        <td colspan="<?= $key_col_mitigasi_biaya - 1 ?>"></td>
                        <td style="border:1pt solid #dee2e6;">Total</td>
                        <td style="border:1pt solid #dee2e6; text-align:right;"><?= rupiah($total_mitigasi_biaya) ?></td>
                    </tr>
                <?php } ?>

                <!-- # Template Analisa Risiko Residual -->
                <?php if (isset($key_col_res_nilai_dampakq4)) { ?>
                    <tr>
                        <td colspan="<?= $key_col_res_nilai_dampakq4 - 1 ?>"></td>
                        <td style="border:1pt solid #dee2e6;">Total</td>
                        <td style="border:1pt solid #dee2e6; text-align:right;"><?= rupiah($total_res_nilai_dampakq4) ?></td>

                    <?php } ?>
                    <?php if (isset($key_col_res_eksposur_dampakq4)) { ?>
                        <td colspan="<?= $key_col_res_eksposur_dampakq4 - $key_col_res_nilai_dampakq4 - 1 ?>"></td>
                        <td style="border:1pt solid #dee2e6; text-align: right;"><?= rupiah($total_res_eksposur_dampakq4) ?></td>
                    </tr>
                <?php } ?>

                <!-- #template Analisa Risiko Inheren  -->
                <?php if (isset($key_col_nilai_dampak_inheren)) { ?>
                    <tr>
                        <td colspan="<?= $key_col_nilai_dampak_inheren - 1 ?>"></td>
                        <td style="border:1pt solid #dee2e6;">Total</td>
                        <td style="border:1pt solid #dee2e6; text-align: right;"><?= rupiah($total_nilai_dampak_inheren) ?></td>

                    <?php } ?>
                    <?php if (isset($key_col_eksposur_risiko)) { ?>
                        <td colspan="<?= $key_col_eksposur_risiko - $key_col_nilai_dampak_inheren - 1 ?>"></td>
                        <td style="border:1pt solid #dee2e6; text-align: right;"><?= rupiah($total_eksposur_risiko) ?></td>
                    </tr>
                <?php } ?>

            </tbody>
        </table>

        <div style=" display: inline-block;width:100%">
            <?php if (isset($nama_jabatan)) { ?>
                <p style=" text-align: right; margin: 0px;">Jakarta,<?= $tanggal ?></p>
                <p style=" text-align: right; margin: 0px;">Mengetahui,</p>
                <p style=" text-align: right; margin: 0px; margin-bottom: 40px;"><?= $nama_unit ?></p>
                <p style="text-align:right; margin: 0px;">&nbsp;</p>
                <p style="text-align:right; margin: 0px;">&nbsp;</p>
                <p style=" text-align: right; margin: 0px;"><?= $nama_user ?></p>
                <p style=" text-align: right; margin: 0px;"><?= $nama_jabatan ?></p>
            <?php } ?>
        </div>
</div>

<style>
    table {
        border-spacing: 0px;
        border-collapse: collapse;
    }

    td {
        vertical-align: top;
    }
</style>