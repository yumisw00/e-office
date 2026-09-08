<?php
$mt_severity_conclusion = $data['mt_severity_conclusion'];
?>
<table class="tableku" style="border: 1px; width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">No</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Ref. Defisiensi Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Defisiensi Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Telah diremediasi (Y/T)</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Periode pengendalian tidak beroperasi secara efektif </th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Nilai Eksposur Defisiensi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kesimpulan Akhir</th>
            <th colspan='4' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Klasifikasi Agregasi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 1</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 2</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 3</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 4</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 5</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 6</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Kotak 7</th>

        </tr>
        <tr>
            <th rowspan='1' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Akun/Pengungkapan yang Terkena Dampak </th>
            <th rowspan='1' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Komponen Pengendalian Internal</th>
            <th rowspan='1' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Proses Bisnis</th>
            <th rowspan='1' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Unit Bisnis</th>

        </tr>
    </thead>

    <tbody>
        <?php
        $no = 1;
        foreach ($data['list'] as $list) { ?>

            <tr>
                <td style="text-align: center; border: 1px solid black; padding: 4px; text-align: left;"> <?= $no ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['no_testing_csa'] ?? '' ?> <?= $list['deskripsi_proses'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_kontrol_defisiensi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;">T</td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['nama_periode'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['max_amount'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $mt_severity_conclusion[$list['id_severity_conclusion']] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_akun'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['komponen_coso'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['ref_risiko'] ?? '' ?> <?= $list['deskripsi_risiko'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_lokasi'] ?? '' ?></td>

                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"></td>
            </tr>

        <?php $no++;
        } ?>
    </tbody>

</table>