<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>LEADSHEET</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Periode Pengujian</td>
            <td style="border: 1px solid black;"><?= $data['periode']->nama ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Proses Bisnis</td>
            <td style="border: 1px solid black;">
                <div><?= $data->ref_proses ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Sub Proses</td>
            <td style="border: 1px solid black;">
                <div><?= $data->no_sub_proses ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Ref Kontrol</td>
            <td style="border: 1px solid black;">
                <div><?= $data->ref_kontrol ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Lokasi</td>
            <td style="border: 1px solid black;">
                <div>PT Hutama Karya (Persero)</div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Pemilik Proses Bisnis</td>
            <td style="border: 1px solid black;">
                <div><?= $data->control_preparer ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Kelas Transaksi Penting/ Nama Proses Pengungkapan (Significant class of Transactions / Disclosure Process Name)</td>
            <td style="border: 1px solid black;">
                <div><?= $data->deskripsi_akun ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Asersi Signifikan</td>
            <td style="border: 1px solid black;">
                <div><?= $data->asersi ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Risiko</td>
            <td style="border: 1px solid black;">
                <div><?= $data->deskripsi_risiko ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Deskripsi Pengendalian</td>
            <td style="border: 1px solid black;">
                <div><?= $data->deskripsi_kontrol ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Frekuensi</td>
            <td style="border: 1px solid black;">
                <div><?= $data->frekuensi ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Sifat Pengendalian</td>
            <td style="border: 1px solid black;">
                <div><?= $data->sifat_pengendalian ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Tujuan Pengendalian</td>
            <td style="border: 1px solid black;">
                <div><?= $data->tujuan_kontrol ?></div>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Atribut Pengendalian</td>
            <td style="border: 1px solid black;">
                <?= $data->rcm_csa_atribut_kontrol->atribut_kontrol ?>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Dokumen Pengendalian Terkait</td>
            <td style="border: 1px solid black;">
                <?= $data->rcm_csa_dok_pendukung->dok_pendukung ?>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Tujuan Walkthrough</td>
            <td style="border: 1px solid black;">
                <?= $data->data_rcm_too->tujuan_walkthrough ?>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Prosedur Walkthrough</td>
            <td style="border: 1px solid black;">
                <?= $data->data_rcm_too->prosedur_walkthrough ?>
            </td>
        </tr>
        <tr>
            <td style="background-color: blue;border: 1px solid black;">Catatan</td>
            <td style="border: 1px solid black;">
                <?= $data->data_rcm_too->catatan ?>
            </td>
        </tr>
        <tr>
            <td></td>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td colspan="2" style="background-color: blue;text-align: center;border: 1px solid black;">Tujuan Walkthrough</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid black;"><?= $data->data_rcm_too->tujuan_walkthrough ?></td>
        </tr>
        <tr>
            <td> </td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: blue;text-align: center;">Prosedur Walkthrough</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid black;"><?= $data->data_rcm_too->prosedur_walkthrough ?></td>
        </tr>
        <tr>
            <td> </td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: blue;text-align: center;">Catatan</td>
        </tr>
        <tr>
            <td colspan="2" style="border: 1px solid black;"><?= $data->data_rcm_too->catatan ?></td>
        </tr>
        <tr>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;border: 1px solid black;">Diisiapkan oleh</th>
            <th style="background-color: blue;border: 1px solid black;">Dievaluasi oleh</th>
            <th style="background-color: blue;border: 1px solid black;">Disetujui oleh</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border: 1px solid black;width: 100px;height: 100px;">
                <img src="<?= (!empty($data->file_ttd['control_preparer_nid'])) ? $data->file_ttd['control_preparer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;">
            </td>
            <td style="border: 1px solid black;width: 100px;height: 100px;">
                <img src="<?= (!empty($data->file_ttd['control_reviewer_nid'])) ? $data->file_ttd['control_reviewer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;">
            </td>
            <td style="border: 1px solid black;width: 100px;height: 100px;">
                <img src="<?= (!empty($data->file_ttd['control_reviewer_nid'])) ? $data->file_ttd['control_reviewer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;">
            </td>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>UNDERSTAND THE PROCESS</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Nature of transactions</td>
            <td style="border: 1px solid black;"><?= $data->data_rcm_too->nature_of_transaction ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Kebijakan</td>
            <td style="border: 1px solid black;"><?= $data->data_rcm_too->kebijakan ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Terproses</td>
            <td style="border: 1px solid black;"><?= $data->data_rcm_too->terproses ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Terinisiasi</td>
            <td style="border: 1px solid black;"><?= ($data->rcm_too_walkthrough) ? $data->rcm_too_walkthrough->terinisiasi : '' ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Tercatat</td>
            <td style="border: 1px solid black;"><?= ($data->rcm_too_walkthrough) ? $data->rcm_too_walkthrough->tercatat : '' ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Dilaporkan di Buku Besar</td>
            <td style="border: 1px solid black;"><?= ($data->rcm_too_walkthrough) ? $data->rcm_too_walkthrough->dilaporkan_buku_besar : '' ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Informasi tambahan</td>
            <td style="border: 1px solid black;"><?= ($data->rcm_too_walkthrough) ? $data->rcm_too_walkthrough->info_tambahan : '' ?></td>
        </tr>
        <tr>
            <td style="background-color: blue;width: 200px;border: 1px solid black;">Perubahan Proses Bisnis</td>
            <td style="border: 1px solid black;"><?= ($data->rcm_too_walkthrough) ? $data->rcm_too_walkthrough->perubahan_proses_bisnis : '' ?></td>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>Risk Control Matrix</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;width:1px;">No.</th>
            <th style="background-color: blue;border: 1px solid black;">Proses</th>
            <th style="background-color: blue;border: 1px solid black;">Kode Risiko</th>
            <th style="background-color: blue;border: 1px solid black;">Deskripsi Risiko</th>
            <th style="background-color: blue;border: 1px solid black;">Kode Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Nama Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Deskripsi Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Frekuensi Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Nature dari Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Tujuan Pengendalian (Detective/Preventive)</th>
            <th style="background-color: blue;border: 1px solid black;">Asersi</th>
            <th style="background-color: blue;border: 1px solid black;">Control Preparer</th>
            <th style="background-color: blue;border: 1px solid black;">Control Reviewer</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;"><?= $data->ref_proses ?></td>
            <td style="border: 1px solid black;"><?= $data->ref_risiko ?></td>
            <td style="border: 1px solid black;"><?= $data->deskripsi_risiko ?></td>
            <td style="border: 1px solid black;"><?= $data->ref_kontrol ?></td>
            <td style="border: 1px solid black;"><?= $data->deskripsi_kontrol ?></td>
            <td style="border: 1px solid black;"><?= $data->rcm_csa_atribut_kontrol->atribut_kontrol ?></td>
            <td style="border: 1px solid black;"><?= $data->frekuensi ?></td>
            <td style="border: 1px solid black;">
                <div></div>
            </td>
            <td style="border: 1px solid black;"> <?= ($data->jenis_kontrol) ? trim(explode("-", $data->jenis_kontrol)[1]) : "" ?></td>
            <td style="border: 1px solid black;">
                <?= $data->asersi ?>
            </td>
            <td style="border: 1px solid black;">
                <?= $data->control_preparer ?>
            </td>
            <td style="border: 1px solid black;">
                <div></div>
            </td>
        </tr>
    </tbody>
</table>


<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>TEST OF ONE</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;width:1px;border: 1px solid black;">No.</th>
            <th style="background-color: blue;border: 1px solid black;">Referensi Kontrol</th>
            <th style="background-color: blue;border: 1px solid black;">Nama Dokumen</th>
            <th style="background-color: blue;border: 1px solid black;">Nomor Referensi</th>
            <th style="background-color: blue;border: 1px solid black;">Efektiftas CSA</th>
            <th style="background-color: blue;border: 1px solid black;">Hasil Evaluasi CSA</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;"><?= $data->ref_kontrol ?></td>
            <td style="border: 1px solid black;"><?= $data->rcm_csa_atribut_kontrol->atribut_kontrol ?></td>
            <td style="border: 1px solid black;"><?= "WT_" . ((!$data->no_ref) ? $data->no_sub_proses : "") . $data->ref_kontrol ?></td>
            <td style="border: 1px solid black;"><?= $data->efektivitas_csa ?></td>
            <td style="border: 1px solid black;"><?= $data->efektivitas_too ?></td>
        </tr>
        <tr>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;width:1px;border: 1px solid black;">No.</th>
            <th style="background-color: blue;border: 1px solid black;">Atribut Pengendalian</th>
            <th style="background-color: blue;border: 1px solid black;">Hasil</th>
            <th style="background-color: blue;border: 1px solid black;">Keterangan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        foreach ($data->rcm_csa_too_atribut as $rcm_csa_too_atribut) { ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_atribut->pertanyaan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_atribut->hasil ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_atribut->keterangan ?></td>
            </tr>
        <?php
            $no++;
        } ?>
        <tr>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue; width:1px;">No.</th>
            <th style="background-color: blue;border: 1px solid black;">Bukti Pendukung</th>
            <th style="background-color: blue;border: 1px solid black;">Lampiran</th>
            <th style="background-color: blue;border: 1px solid black;">Ketersediaan Dokumen</th>
            <th style="background-color: blue;border: 1px solid black;">Keterangan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        if ($data->rcm_csa_too_dok_pendukung) {
            $no = 1;
            foreach ($data->rcm_csa_too_dok_pendukung as $rcm_csa_too_dok_pendukung) {
        ?>
                <tr>
                    <td style="border: 1px solid black;"><?= $no ?></td>
                    <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->dokumen ?></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->ketersediaan_dokumen ?></td>
                    <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->keterangan_dokumen ?></td>
                </tr>
            <?php
                $no++;
            }
        } else { ?>
            <tr>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
            </tr>
        <?php
        }
        ?>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>EVALUASI EFEKTIVITAS RANCANGAN PENGENDALIAN INTERNAL</h2>
            </th>
        </tr>
    </thead>
</table>
<?php
$rcm_csa_too_pengujian_arr = [];
foreach ($data->rcm_csa_too_pengujian as $rcm_csa_too_pengujian) {
    $rcm_csa_too_pengujian_arr[$rcm_csa_too_pengujian->id_pertanyaan_tod_pengujian_detail] = $rcm_csa_too_pengujian;
}
// var_dump($rcm_csa_too_pengujian_arr);
?>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue; width:1px;border: 1px solid black;" rowspan="3">No</th>
            <th style="background-color: blue;border: 1px solid black;" rowspan="3">Kode Pengendalian</th>
            <?php foreach ($data->mt_pertanyaan_tod_pengujian as $mt_pertanyaan_tod_pengujian) { ?>
                <th style="background-color: blue;border: 1px solid black;" colspan="<?= ((!empty($data->mt_pertanyaan_tod_pengujian_detail[$mt_pertanyaan_tod_pengujian->id_pertanyaan_tod_pengujian])) ? count($data->mt_pertanyaan_tod_pengujian_detail[$mt_pertanyaan_tod_pengujian->id_pertanyaan_tod_pengujian]) : 1) * 2 ?>"><?= $mt_pertanyaan_tod_pengujian->nama ?></th>
            <?php } ?>
        </tr>
        <tr>
            <?php foreach ($data->mt_pertanyaan_tod_pengujian as $mt_pertanyaan_tod_pengujian) {
                foreach ($data->mt_pertanyaan_tod_pengujian_detail[$mt_pertanyaan_tod_pengujian->id_pertanyaan_tod_pengujian] as $mt_pertanyaan_tod_pengujian_detail) { ?>
                    <th style="background-color: blue;border: 1px solid black;" colspan="2"><?= $mt_pertanyaan_tod_pengujian_detail->deskripsi ?></th>
                <?php } ?>
            <?php } ?>
        </tr>
        <tr>
            <?php foreach ($data->mt_pertanyaan_tod_pengujian as $mt_pertanyaan_tod_pengujian) {
                foreach ($data->mt_pertanyaan_tod_pengujian_detail[$mt_pertanyaan_tod_pengujian->id_pertanyaan_tod_pengujian] as $mt_pertanyaan_tod_pengujian_detail) { ?>
                    <th style="background-color: blue;border: 1px solid black;">Y/N/NA</th>
                    <th style="background-color: blue;border: 1px solid black;">Penjelasan</th>
            <?php }
            } ?>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;"><?= $data->ref_kontrol ?></td>
            <?php
            // rcm_csa_too_pengujian_arr
            foreach ($data->mt_pertanyaan_tod_pengujian as $mt_pertanyaan_tod_pengujian) {
                foreach ($data->mt_pertanyaan_tod_pengujian_detail[$mt_pertanyaan_tod_pengujian->id_pertanyaan_tod_pengujian] as $mt_pertanyaan_tod_pengujian_detail) {
                    // var_dump($mt_pertanyaan_tod_pengujian_detail->id_pertanyaan_tod_pengujian_detail);
            ?>
                    <td style="border: 1px solid black;"><?= strtoupper((!empty($rcm_csa_too_pengujian_arr[$mt_pertanyaan_tod_pengujian_detail->id_pertanyaan_tod_pengujian_detail])) ? $rcm_csa_too_pengujian_arr[$mt_pertanyaan_tod_pengujian_detail->id_pertanyaan_tod_pengujian_detail]->jawaban : "") ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($rcm_csa_too_pengujian_arr[$mt_pertanyaan_tod_pengujian_detail->id_pertanyaan_tod_pengujian_detail])) ? $rcm_csa_too_pengujian_arr[$mt_pertanyaan_tod_pengujian_detail->id_pertanyaan_tod_pengujian_detail]->des_jawaban : "" ?></td>
            <?php
                }
            }
            ?>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>KESIMPULAN</h2>
            </th>
        </tr>
    </thead>
</table>
<?php
$rcm_csa_too_kesimpulan_arr = [];
foreach ($data->rcm_csa_too_kesimpulan as $rcm_csa_too_kesimpulan) {
    $rcm_csa_too_kesimpulan_arr[$rcm_csa_too_kesimpulan->id_pertanyaan_tod_kesimpulan_detail] = $rcm_csa_too_kesimpulan;
}
?>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;width:1px;border: 1px solid black;" rowspan="3">No</th>
            <th style="background-color: blue;border: 1px solid black;" rowspan="3">Kode Pengendalian</th>
            <?php
            foreach ($data->mt_pertanyaan_tod_kesimpulan as $mt_pertanyaan_tod_kesimpulan) {
            ?>
                <th style="background-color: blue;border: 1px solid black;" colspan="<?= count($data->mt_pertanyaan_tod_kesimpulan_detail[$mt_pertanyaan_tod_kesimpulan->id_pertanyaan_tod_kesimpulan]) * 2 ?>"><?= $mt_pertanyaan_tod_kesimpulan->nama ?></th>
            <?php
            }
            ?>
            <th style="background-color: blue;border: 1px solid black;" rowspan="2">Hasil Final</th>
            <th style="background-color: blue;border: 1px solid black;" rowspan="3">Rekomendasi</th>
        </tr>
        <tr>
            <?php
            foreach ($data->mt_pertanyaan_tod_kesimpulan as $mt_pertanyaan_tod_kesimpulan) {
                foreach ($data->mt_pertanyaan_tod_kesimpulan_detail[$mt_pertanyaan_tod_kesimpulan->id_pertanyaan_tod_kesimpulan] as $mt_pertanyaan_tod_kesimpulan_detail) {
            ?>
                    <th style="background-color: blue;border: 1px solid black;" colspan="2"><?= $mt_pertanyaan_tod_kesimpulan_detail->deskripsi ?></th>
            <?php
                }
            }
            ?>
        </tr>
        <tr>
            <?php
            foreach ($data->mt_pertanyaan_tod_kesimpulan as $mt_pertanyaan_tod_kesimpulan) {
                foreach ($data->mt_pertanyaan_tod_kesimpulan_detail[$mt_pertanyaan_tod_kesimpulan->id_pertanyaan_tod_kesimpulan] as $mt_pertanyaan_tod_kesimpulan_detail) {
            ?>
                    <th style="background-color: blue;border: 1px solid black;">Y/N/NA</th>
                    <th style="background-color: blue;border: 1px solid black;">Explanation</th>
            <?php
                }
            }
            ?>
            <th style="background-color: blue;border: 1px solid black;">Efektif / Tidak Efektif / Tidak Ada Transaksi</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;"><?= $data->ref_kontrol ?></td>
            <?php
            foreach ($data->mt_pertanyaan_tod_kesimpulan as $mt_pertanyaan_tod_kesimpulan) {
                foreach ($data->mt_pertanyaan_tod_kesimpulan_detail[$mt_pertanyaan_tod_kesimpulan->id_pertanyaan_tod_kesimpulan] as $mt_pertanyaan_tod_kesimpulan_detail) {
            ?>
                    <th style="border: 1px solid black;"><?= strtoupper((!empty($rcm_csa_too_kesimpulan_arr[$mt_pertanyaan_tod_kesimpulan_detail->id_pertanyaan_tod_kesimpulan_detail])) ? $rcm_csa_too_kesimpulan_arr[$mt_pertanyaan_tod_kesimpulan_detail->id_pertanyaan_tod_kesimpulan_detail]->jawaban : "") ?></th>
                    <th style="border: 1px solid black;"><?= (!empty($rcm_csa_too_kesimpulan_arr[$mt_pertanyaan_tod_kesimpulan_detail->id_pertanyaan_tod_kesimpulan_detail])) ? $rcm_csa_too_kesimpulan_arr[$mt_pertanyaan_tod_kesimpulan_detail->id_pertanyaan_tod_kesimpulan_detail]->des_jawaban : "" ?></th>
            <?php
                }
            }
            ?>
            <th style="border: 1px solid black;"><?= strtoupper($data->hasil_kesimpulan) ?></th>
            <th style="border: 1px solid black;"><?= $data->rekomendasi_kesimpulan ?></th>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>EUC</h2>
            </th>
        </tr>
    </thead>
</table>
<?php
$rcm_too_euc_arr = [];
foreach ($data->rcm_too_euc as $rcm_too_euc) {
    $rcm_too_euc_arr[$rcm_too_euc['id_pertanyaan_euc_detail']] = $rcm_too_euc;
}
// dd($rcm_too_euc_arr);
?>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue;border: 1px solid black;">Kompleksitas</th>
            <th style="background-color: blue;border: 1px solid black;">Pertanyaan Kunci</th>
            <th style="background-color: blue;border: 1px solid black;">Hasil Evaluasi</th>
            <th style="background-color: blue;border: 1px solid black;">Kesimpulan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $kesimpulan = '';
        foreach ($data->mt_pertanyaan_euc as $mt_pertanyaan_euc) {
            // var_dump($rcm_too_euc_arr[$data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->id_pertanyaan_euc_detail]);
        ?>
            <tr>
                <td style="border: 1px solid black;" rowspan="<?= (!empty($data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc])) ? count($data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc]) : 1 ?>"><?= $mt_pertanyaan_euc->kompleksitas ?></td>
                <td style="border: 1px solid black;"><?= $data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->pertanyaan_kunci ?></td>
                <td style="border: 1px solid black;"><?= (!empty($rcm_too_euc_arr[$data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->id_pertanyaan_euc_detail])) ? $rcm_too_euc_arr[$data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->id_pertanyaan_euc_detail]['hasil_evaluasi'] : "" ?></td>
                <td style="border: 1px solid black;"><?= (!empty($rcm_too_euc_arr[$data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->id_pertanyaan_euc_detail])) ? $rcm_too_euc_arr[$data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]->id_pertanyaan_euc_detail]['kesimpulan_euc'] : "" ?></td>

                <?php
                // unset($data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc][0]);
                ?>
            </tr>
            <?php
            // $n = 0;
            foreach ($data->mt_pertanyaan_euc_detail[$mt_pertanyaan_euc->id_pertanyaan_euc] as $n => $mt_pertanyaan_euc_detail) {
                if ($n == 0)
                    continue;
                if (!empty($rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail]))
                    $kesimpulan = $rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail]['kesimpulan_euc'];
                // var_dump($mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail);
                // var_dump($rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail]);
            ?>
                <tr>
                    <td style="border: 1px solid black;"><?= $mt_pertanyaan_euc_detail->pertanyaan_kunci ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail])) ? $rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail]['hasil_evaluasi'] : "" ?></td>
                    <td style="border: 1px solid black;"><?= (!empty($rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail])) ? $rcm_too_euc_arr[$mt_pertanyaan_euc_detail->id_pertanyaan_euc_detail]['kesimpulan'] : "" ?></td>
                </tr>

            <?php
                // $n++;
            }
            ?>

        <?php
        }
        ?>
        <tr>
            <td colspan="3" style="text-align: right;">Kesimpulan Evaluasi EUC</td>
            <td style="border: 1px solid black;"><?= $kesimpulan ?></td>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>Assess MRC</h2>
            </th>
        </tr>
    </thead>
</table>
<?php
$data_rcm_too_mrc = [];
$kesimpulan = '';
foreach ($data->rcm_too_mrc as $rcm_too_mrc) {
    $data_rcm_too_mrc[$rcm_too_mrc->id_pertanyaan_mrc_detail] = $rcm_too_mrc;
    $kesimpulan = $rcm_too_mrc->kesimpulan_mrc;
}
?>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th rowspan="2" style="background-color: blue; width: 1px;border: 1px solid black;">No</th>
            <th colspan="2" style="background-color: blue;border: 1px solid black;">Referensi Kontrol</th>
            <th rowspan="2" style="background-color: blue;border: 1px solid black;">Response</th>
        </tr>
        <tr>
            <th style="background-color: blue;border: 1px solid black;">Kriteria</th>
            <th style="background-color: blue;border: 1px solid black;">Pertanyaan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        foreach ($data->mt_pertanyaan_mrc as $mt_pertanyaan_mrc) {
            $count = count($data->mt_pertanyaan_mrc_detail[$mt_pertanyaan_mrc->id_pertanyaan_mrc]);
        ?>
            <tr>
                <td style="border: 1px solid black;" rowspan="<?= $count ?? 1 ?>"><?= $no ?></td>
                <td style="border: 1px solid black;" rowspan="<?= $count ?? 1 ?>"><?= $mt_pertanyaan_mrc->nama ?></td>
                <td style="border: 1px solid black;"><?= $data->mt_pertanyaan_mrc_detail[$mt_pertanyaan_mrc->id_pertanyaan_mrc][0]->deskripsi ?></td>
                <td style="border: 1px solid black;">
                    <?= (!empty($data_rcm_too_mrc[$data->mt_pertanyaan_mrc_detail[$mt_pertanyaan_mrc->id_pertanyaan_mrc][0]->id_pertanyaan_mrc_detail]))
                        ? $data_rcm_too_mrc[$data->mt_pertanyaan_mrc_detail[$mt_pertanyaan_mrc->id_pertanyaan_mrc][0]->id_pertanyaan_mrc_detail]->jawaban
                        : "" ?>
                </td>
            </tr>
            <?php
            foreach ($data->mt_pertanyaan_mrc_detail[$mt_pertanyaan_mrc->id_pertanyaan_mrc] as $n => $pertanyaan_detail) {
                if ($n == 0)
                    continue;
            ?>
                <tr>
                    <td style="border: 1px solid black;"><?= $pertanyaan_detail->deskripsi ?></td>
                    <td style="border: 1px solid black;">
                        <?= (!empty($data_rcm_too_mrc[$pertanyaan_detail->id_pertanyaan_mrc_detail]))
                            ? $data_rcm_too_mrc[$pertanyaan_detail->id_pertanyaan_mrc_detail]->jawaban
                            : ""
                        ?>
                    </td>
                </tr>
            <?php
            }
            ?>
        <?php
            $no++;
        }
        ?>
        <tr>
            <td colspan="3" style="text-align: right;border: 1px solid black;">Kesimpulan</td>
            <td style="border: 1px solid black;"><?= $kesimpulan ?></td>
        </tr>
    </tbody>
</table>

<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="2">
                <h2>Assess IPE</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th rowspan="3" style="width: 1px;background-color: blue;border: 1px solid black;">No</th>
            <th rowspan="3" style="width: 500px;background-color: blue;border: 1px solid black;">Nama Laporan (Report Name)</th>
            <th rowspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Deskripsi IPE (IPE Description)</th>
            <th rowspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Diperoleh dari Pemilik Proses (Nama &amp; Jabatan)(Obtained from Process Owner(Name &amp; Title))</th>
            <th rowspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Tanggal Laporan Dihasilkan (Date Report Generated)</th>
            <th rowspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Sumber Sistem IT/Aplikasi (Source IT System/ Application)</th>
            <th rowspan="2" colspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Jika tidak termasuk dalam ruang lingkup, mohon dokumentasikan pengendalian/proses mitigasi yang digunakan untuk memvalidasi integritas data.(If not in scope, please document the mitigating controls/processes to validate the data integrity)</th>
            <th colspan="4" style="width: 200px;background-color: blue;border: 1px solid black;">Bagaimana IPE dibuat?(How was the IPE created?)</th>
            <th colspan="4" style="width: 200px;background-color: blue;border: 1px solid black;">Bagaimana keluaran dari IPE?(What was the IPE output to?)</th>
            <th colspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Pertimbangan Elemen IPE(IPE Element Considerations)</th>
            <th rowspan="3" style="width: 200px;background-color: blue;border: 1px solid black;">Kesimpulan</th>
        </tr>
        <tr>
            <th rowspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Dari sistem IT, dengan pengguna memasukkan parameter(From an IT system, with the user entering parameters)</th>
            <th rowspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Dari sistem IT, dengan TANPA pengguna memasukkan parameter(From an IT system, with NO user entered parameters)</th>
            <th colspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Dalam alat komputasi pengguna akhir (misalnya Ms Excel)(In an End-User Computing Tool (e.g. MS Excel))</th>
            <th colspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Format tidak dapat dimodifikasi (misalnya, Kertas, PDF). Ya/Tidak, dan sebutkan spesifik(A non-modifiable format? (e.g. paper, PDF) Yes/No and specify)</th>
            <th colspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Alat komputasi pengguna akhir?(misalnya Ms Excel) . Ya/Tidak, dan sebutkan spesifik(End-user computing tool?(e.g. MS Excel)Yes/No and specify)</th>
            <th rowspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Parameter (Parameters)</th>
            <th rowspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Sumber Data</th>
            <th rowspan="2" style="width: 200px;background-color: blue;border: 1px solid black;">Formula</th>
        </tr>
        <tr>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Y/N/NA</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Keterangan</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Y/N/NA</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Keterangan</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Y/N/NA</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Keterangan</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Y/N/NA</th>
            <th style="width: 200px;background-color: blue;border: 1px solid black;">Keterangan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        foreach ($data->rcm_csa_too_dok_pendukung as $rcm_csa_too_dok_pendukung) {
        ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->dokumen ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->deskripsi_ipe ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->reviewer_csa . ($rcm_csa_too_dok_pendukung->reviewer_csa_jabatan) ? "(" . $rcm_csa_too_dok_pendukung->reviewer_csa_jabatan . ")" : "" ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->tgl_laporan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->sumber_laporan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->dokumentasi_control ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->dokumentasi_control_keterangan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->parameter_user ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->parameter_non_user ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->asal_aplikasi ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->alat_penghitungan_manual_keterangan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->format ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->format_keterangan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->alat_penghitungan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->alat_penghitungan_keterangan ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->parameters ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->source_data ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->logika ?></td>
                <td style="border: 1px solid black;"><?= $rcm_csa_too_dok_pendukung->kesimpulan_ipe ?></td>
            </tr>
        <?php
            $no++;
        }
        ?>
    </tbody>
</table>
<pre>
    <?php //
    // dd($data->rcm_csa_too_dok_pendukung->toArray());
    // dd($data->mt_pertanyaan_mrc_detail);
    // var_dump($rcm_too_euc_arr);
    // dd($rcm_too_euc_arr);
    // var_dump($data->mt_pertanyaan_euc_detail);
    // var_dump($data)
    ?>
</pre>