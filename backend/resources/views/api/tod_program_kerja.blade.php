<table style="width: 100%; border-collapse: collapse;">

    <tr>
        <td></td>
        <td style="text-align: center;" rowspan="3"><img src="<?= $data->logo ?>" alt="" style="width: 100px; padding:10px;"></td>
        <td style="color: #C00000;" colspan="2"><b><i>PT HUTAMA KARYA (PERSERO)</i></b></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="2"><b>Walkthrough</b></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Proses</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kode Risiko</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Deskripsi Risiko</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kode Pengendalian</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Deskripsi Pengendalian</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Frekuensi Pengendalian</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;"> Tujuan Pengendalian<br />(Detective/Preventive)</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Asersi</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Control Preparer</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Control Reviewer</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->deskripsi_proses ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->ref_risiko ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->deskripsi_risiko ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->ref_kontrol ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->deskripsi_kontrol ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->frekuensi ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->tujuan_kontrol ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->asersi ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->control_preparer ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->control_reviewer_jabatan ?></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="10">Prosedur evaluasi mengacu pada SK-5/DKU.MBU/11/2024</td>
    </tr>
    <tr>
        <td></td>
        <td colspan="10">Tentang Petunjuk Teknis Pengendalian Internal atas Pelaporan Keuangan (Internal Control over Financial Reporting) Badan Usaha Milik Negara</td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="color: red;" colspan="10"><i>(diisi oleh Auditor setelah melakukan pengujian)</i></td>
    </tr>
    <tr>
        <td></td>
        <?php foreach ($data->mt_pertanyaan_pengujian_tod_detail as $mt_pertanyaan_pengujian_tod_detail) {
        ?>
            <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" colspan="2"><?= $mt_pertanyaan_pengujian_tod_detail->deskripsi ?></td>
        <?php
        } ?>
    </tr>
    <tr>
        <td></td>
        <?php foreach ($data->mt_pertanyaan_pengujian_tod_detail as $mt_pertanyaan_pengujian_tod_detail) {
        ?>
            <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Ya/Tidak/NA</td>
            <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Penjelasan</td>
        <?php
        } ?>
    </tr>
    <tr>
        <td></td>
        <?php foreach ($data->mt_pertanyaan_pengujian_tod_detail as $mt_pertanyaan_pengujian_tod_detail) {
            if (!empty($data->rcm_csa_tod_pengujian[$mt_pertanyaan_pengujian_tod_detail->id_pertanyaan_pengujian_tod_detail])) {
        ?>
                <td style="border: 1px solid black;"><?= strtoupper($data->rcm_csa_tod_pengujian[$mt_pertanyaan_pengujian_tod_detail->id_pertanyaan_pengujian_tod_detail]->jawaban) ?></td>
                <td style="border: 1px solid black;"><?= $data->rcm_csa_tod_pengujian[$mt_pertanyaan_pengujian_tod_detail->id_pertanyaan_pengujian_tod_detail]->des_jawaban ?></td>
            <?php
            } else {
            ?>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
        <?php
            }
        } ?>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="10"><b>Management Review Control (MRC)</b> <i style="color: red;">(diisi oleh Auditor atas hasil evaluasi yang dilakukan untuk MRC)</i></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kriteria</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" colspan="2">Pertanyaan Kunci*</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" colspan="2">Hasil Evaluasi</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kesimpulan</td>
    </tr>
    <?php
    foreach ($data->mt_pertanyaan_mrc_tod as $mt_pertanyaan_mrc_tod) {
        $child = 1;
        if (count($data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod]) > 1)
            $child = count($data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod]);
    ?>
        <tr>
            <td></td>
            <td style="border: 1px solid black;" rowspan="<?= $child ?>"><?= $mt_pertanyaan_mrc_tod->nama ?></td>
            <td style="border: 1px solid black;" colspan="2"><?= $data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod][0]->deskripsi ?></td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data->rcm_tod_mrc[$data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod][0]->id_pertanyaan_mrc_tod_detail]) ? $data->rcm_tod_mrc[$data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod][0]->id_pertanyaan_mrc_tod_detail]->jawaban : "") ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_mrc[$data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod][0]->id_pertanyaan_mrc_tod_detail]) ? $data->rcm_tod_mrc[$data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod][0]->id_pertanyaan_mrc_tod_detail]->kesimpulan : "") ?></td>
        </tr>
        <?php
        if (count($data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod]) > 1) {
            $n = 0;
            foreach ($data->mt_pertanyaan_mrc_tod_detail_arr[$mt_pertanyaan_mrc_tod->id_pertanyaan_mrc_tod] as $mt_pertanyaan_mrc_tod_detail) {
                if ($n == 0) {
                    $n++;
                    continue;
                }
        ?>
                <tr>
                    <td></td>
                    <td style="border: 1px solid black;" colspan="2"><?= $mt_pertanyaan_mrc_tod_detail->deskripsi ?></td>
                    <td style="border: 1px solid black;" colspan="2"><?= (!empty($data->rcm_tod_mrc[$mt_pertanyaan_mrc_tod_detail->id_pertanyaan_mrc_tod_detail])) ? $data->rcm_tod_mrc[$mt_pertanyaan_mrc_tod_detail->id_pertanyaan_mrc_tod_detail]->jawaban : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_mrc[$mt_pertanyaan_mrc_tod_detail->id_pertanyaan_mrc_tod_detail])) ? $data->rcm_tod_mrc[$mt_pertanyaan_mrc_tod_detail->id_pertanyaan_mrc_tod_detail]->kesimpulan : "" ?></td>
                </tr>

    <?php

                $n++;
            }
        }
    }
    ?>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;" colspan="5">
        <td style="border: 1px solid black;"><?= $data->kesimpulan_mrc ?></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="3"><b>Sifat Pengendalian: IT-Dependant Manual (ITDM) - End User Computing (EUC)</b></td>
        <td style="color: red;" colspan="3"><i>diisi HANYA jika sifat pengendalian adalah ITDM - EUC</i></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kompleksitas</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" colspan="2">Pertanyaan Kunci</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kesimpulan</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Penjelasan</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Ref. WP</td>
    </tr>
    <?php
    foreach ($data->mt_pertanyaan_euc_tod as $mt_pertanyaan_euc_tod) {
        $child = 1;
        if (count($data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod]) > 1)
            $child = count($data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod]);
    ?>
        <tr>
            <td></td>
            <td style="border: 1px solid black;" rowspan="<?= $child ?>"><?= $mt_pertanyaan_euc_tod->kompleksitas ?></td>
            <td style="border: 1px solid black;" colspan="2"><?= $data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->pertanyaan_kunci ?></td>
            <td style="border: 1px solid black;text-align: center;"><?= (!empty($data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail]->kesimpulan : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail]->hasil_evaluasi : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod][0]->id_pertanyaan_euc_tod_detail]->ref_wp : "" ?></td>
        </tr>
        <?php
        if ($child > 1) {
            $n = 0;
            foreach ($data->mt_pertanyaan_euc_tod_detail[$mt_pertanyaan_euc_tod->id_pertanyaan_euc_tod] as $mt_pertanyaan_euc_tod_detail) {
                if ($n == 0) {
                    $n++;
                    continue;
                }

        ?>
                <tr>
                    <td></td>
                    <td style="border: 1px solid black;" colspan="2"><?= $mt_pertanyaan_euc_tod_detail->pertanyaan_kunci ?></td>
                    <td style="border: 1px solid black;text-align: center;"><?= (!empty($data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail]->kesimpulan : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail]->hasil_evaluasi : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail])) ? $data->rcm_tod_euc[$mt_pertanyaan_euc_tod_detail->id_pertanyaan_euc_tod_detail]->ref_wp : "" ?></td>
                </tr>
    <?php
            }
        }
    }
    ?>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="10"><b>Sifat Pengendalian: ITDM - Information Produced by Entity (IPE)</b></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Jenis Laporan</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" colspan="2">Pertanyaan Kunci</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Kesimpulan</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Penjelasan</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Ref. WP</td>
    </tr>
    <?php
    foreach ($data->mt_pertanyaan_ipe_tod as $mt_pertanyaan_ipe_tod) {
        $child = 1;
        if (count($data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod]) > 1)
            $child = count($data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod]);
    ?>
        <tr>
            <td></td>
            <td style="border: 1px solid black;" rowspan="<?= $child ?>"><?= $mt_pertanyaan_ipe_tod->nama ?></td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0])) ? $data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->deskripsi : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail]->kesimpulan : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail]->hasil_evaluasi : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod][0]->id_pertanyaan_ipe_tod_detail]->ref_wp : "" ?></td>
        </tr>
        <?php
        if ($child > 1) {
            $n = 0;
            foreach ($data->mt_pertanyaan_ipe_tod_detail[$mt_pertanyaan_ipe_tod->id_pertanyaan_ipe_tod] as $mt_pertanyaan_ipe_tod_detail) {
                if ($n == 0) {
                    $n++;
                    continue;
                }
        ?>
                <tr>
                    <td></td>
                    <td style="border: 1px solid black;" colspan="2"><?= $mt_pertanyaan_ipe_tod_detail->deskripsi ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail]->kesimpulan : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail]->hasil_evaluasi : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail])) ? $data->rcm_tod_ipe[$mt_pertanyaan_ipe_tod_detail->id_pertanyaan_ipe_tod_detail]->ref_wp : "" ?></td>
                </tr>
    <?php
            }
        }
    }
    ?>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="10"><b>Management Review Control (MRC)</b> <i style="color: red;">(diisi oleh Auditor atas hasil evaluasi yang dilakukan untuk MRC)</i></td>
    </tr>
    <tr>
        <td></td>
        <?php
        foreach ($data->mt_pertanyaan_kesimpulan_tod_detail as $mt_pertanyaan_kesimpulan_tod_detail) {
        ?>
            <td style="background-color: red;border: 1px solid black;color: white;text-align: center;" colspan="2"><?= $mt_pertanyaan_kesimpulan_tod_detail->deskripsi ?></td>
        <?php
        }
        ?>
        <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;" rowspan="2">Rekomendasi</td>
    </tr>
    <tr>
        <td></td>
        <?php
        foreach ($data->mt_pertanyaan_kesimpulan_tod_detail as $mt_pertanyaan_kesimpulan_tod_detail) {
        ?>
            <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Efektif/Tidak efektif</td>
            <td style="background-color: #C00000;border: 1px solid black;color: white;text-align: center;">Penjelasan</td>
        <?php
        }
        ?>
    </tr>
    <tr>
        <td></td>

        <?php
        foreach ($data->mt_pertanyaan_kesimpulan_tod_detail as $mt_pertanyaan_kesimpulan_tod_detail) {
        ?>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_kesimpulan[$mt_pertanyaan_kesimpulan_tod_detail->id_pertanyaan_kesimpulan_tod_detail])) ? $data->rcm_csa_tod_kesimpulan[$mt_pertanyaan_kesimpulan_tod_detail->id_pertanyaan_kesimpulan_tod_detail]->jawaban : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_kesimpulan[$mt_pertanyaan_kesimpulan_tod_detail->id_pertanyaan_kesimpulan_tod_detail])) ? $data->rcm_csa_tod_kesimpulan[$mt_pertanyaan_kesimpulan_tod_detail->id_pertanyaan_kesimpulan_tod_detail]->des_jawaban : "" ?></td>
        <?php
        }
        ?>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->rekomendasi_kesimpulan ?></td>
    </tr>
</table>
<?php
?>