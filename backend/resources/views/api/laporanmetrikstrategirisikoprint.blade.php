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
    <?php
    // echo '<pre>';
    // var_dump($tanggal_tanda_tangan);
    // return;
    ?>

    <h4 style="text-align: center; margin-bottom: 0px;">Metrik Strategi Risiko</h4>
    <h4 style="text-align: center; margin-top: 0px;"><?= $tahun ?></h4>
</div>
<table>

    <thead>
        <tr>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;' colspan="2">Nilai Kapasitas Risiko Perusahaan</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Nilai Selera Risiko Perusahaan</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Nilai Toleransi Risiko Perusahaan</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Nilai Batasan Risiko</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($rowslimit as $r) { ?>
            <tr>
                <td style='border:1pt solid #DEE2E6; text-align: right;' colspan="2"><?= rupiah($r->kapasitas_risiko) ?></td>
                <td style='border:1pt solid #DEE2E6; text-align: right;'><?= rupiah($r->risk_appetite) ?></td>
                <td style='border:1pt solid #DEE2E6; text-align: right;'><?= rupiah($r->risk_tolerance) ?></td>
                <td style='border:1pt solid #DEE2E6; text-align: right;'><?= rupiah($r->risk_limit) ?></td>
            </tr>
        <?php } ?>
    </tbody>
</table>
<br />
<table>
    <thead>
        <tr>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>No</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Kategori Risiko Perusahaan</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Kategori Risiko T2 & T3 KBUMN</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Risk Appetite Statement</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Sikap Terhadap Risiko</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Parameter</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Satuan Ukuran</th>
            <th style='background-color:#2b2a4c;color:#ffffff;border:1pt solid #DEE2E6;'>Nilai Batasan/Limit</th>
        </tr>
    </thead>
    <tbody>
        <?php $no = 1;
        foreach ($rowsmetrik as $r) { ?>
            <tr>
                <td style='border:1pt solid #DEE2E6;'><?= $no++ ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->namajenis_risiko ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->namataksonomi ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->risk_appetite_statement ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->namasikap_terhadap_risiko ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->paramater ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->satuan_ukuran ?></td>
                <td style='border:1pt solid #DEE2E6;'><?= $r->nilai_batasan ?></td>
            </tr>
        <?php } ?>
    </tbody>
</table>

<style>
    /* @page {
        size: A4 portrait;
    } */

    table {
        border-spacing: 0px;
        border-collapse: collapse;
    }

    td {
        vertical-align: top;
    }
</style>