<?php
$mt_information = $data['mt_information'];
$mt_asersi = $data['mt_asersi'];
$mt_pengujian = $data['mt_pengujian'];
?>
<table style="border: 1px; width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">No</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Ref. Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Nama Aktivitas Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Aktivitas Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Dokumen Pendukung</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Pengendalian Utama (Y/T)</th>

            <th colspan='4' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Information</th>
            <th colspan='7' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Asersi LK</th>

            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Preventif/Detektif</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Sifat Pelaksanaan Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Jenis Pengendalian Otomatis</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Frekuensi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Aplikasi Pendukung</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Fungsi Pelaksana Aktivitas Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Pelaku Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Item LK terdampak</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Periode Efektif</th>

            <!-- <th colspan='8' style="color: white;">Periode Efektif</th> -->
            <th colspan="8" style="color: black;background-color: #a0a8b0; border: 1px solid black; padding: 4px; text-align: left;">Pengujian Rancangan Pengendalian</th>
        </tr>
        <tr>
            <?php foreach ($mt_information as $info) { ?>
                <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;"><?= $info ?></th>
            <?php } ?>

            <?php foreach ($mt_asersi as $asersi) { ?>
                <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;"><?= $asersi ?></th>
            <?php } ?>
            <?php foreach ($mt_pengujian as $pengujian) { ?>
                <th style="color: black;background-color: #a0a8b0; border: 1px solid black; padding: 4px; text-align: left; "><?= $pengujian ?></th>
            <?php } ?>

            <th style="color: black;background-color: #a0a8b0; border: 1px solid black; padding: 4px; text-align: left; ">Referensi KK</th>
            <th style="color: black;background-color: #a0a8b0; border: 1px solid black; padding: 4px; text-align: left; ">Kesimpulan</th>
        </tr>
    </thead>
    <?php
    $no = 1;
    foreach ($data['list'] as $list) { ?>

        <tbody>
            <tr>
                <td style="text-align: center; border: 1px solid black; padding: 4px; text-align: left;"> <?= $no ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['ref_kontrol'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['deskripsi_kontrol'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['atribut_kontrol'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['dok_pendukung'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['kontrol_utama'] ?></td>
                <?php foreach ($mt_information as $info) { ?>
                    <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['information'] ?></td>
                <?php } ?>
                <?php
                $kode_asersi = explode(",", $list['kode_asersi']);
                $kode_asersi_arr = [];
                foreach ($kode_asersi as $asr) {
                    $kode_asersi_arr[trim($asr)] = trim($asr);
                }
                foreach ($mt_asersi as $asersi) {
                ?>
                    <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= (!empty($kode_asersi_arr[$asersi])) ? "V" : ""  ?></td>
                <?php
                }
                ?>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['jenis_kontrol'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['sifat_pengendalian'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['jenis_pengendalian_otomatis'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['frekuensi'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['aplikasi_pendukung'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['deskripsi_lokasi'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> preparer</td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['deskripsi_akun'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['periode_efektif'] ?></td>
                <?php

                $jawaban_array = [];
                $jawaban_arr = explode('<eos>', $list['jawaban']);
                foreach ($jawaban_arr as $jaw_arr) {
                    if (!$jaw_arr)
                        continue;
                    $jwb = explode('<space>', $jaw_arr);
                    $jawaban_array[$jwb[0]] = $jwb[1];
                }
                ?>
                <?php foreach ($mt_pengujian as $pengujian) { ?>
                    <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= (!empty($jawaban_array[$pengujian])) ? $jawaban_array[$pengujian] : ""  ?></td>
                <?php } ?>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['no_testing_csa'] ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"> <?= $list['hasil_kesimpulan'] ?></td>
            </tr>
        </tbody>

    <?php $no++;
    } ?>

</table>
<style>
    table.tableku1 {
        width: 100%;
        border-collapse: collapse;
    }


    table.tableku1 th,
    table.tableku1 td {
        border: 1px solid black;
        padding: 4px;
        text-align: left;
    }


    table.tableku1 th {
        background: #333399;
    }
</style>