<!-- <table cellspacing="0" cellpadding="5" width="100%"> -->
<table style="width: 100%; border-collapse: collapse;">

    <tr>
        <td></td>
        <td style="text-align: center;" rowspan="3"><img src="<?= $data->logo ?>" alt="" style="width: 100px; padding:10px;"></td>
        <td style="color: #C00000;" colspan="2"><b><i>PT HUTAMA KARYA (PERSERO)</i></b></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="2"><b>Walkthrough and Test of Design FY2025</b></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;width: 200px;">Ref. Kontrol</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->ref_kontrol ?></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Periode Pengujian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->tahun ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Lokasi</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->lokasi ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Proses Bisnis</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_proses ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Sub Proses</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_sub_proses ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Pemilik Proses Bisnis</td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->deskripsi_lokasi ?></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->control_preparer ?></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Kelas Transaksi Penting/ Nama Proses Pengungkapan (Significant class of Transactions / Disclosure Process Name)</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_akun ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Asersi Signifikan</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->asersi ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Kode Risiko</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->ref_risiko ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Deskripsi Risiko</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_risiko ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Deskripsi Pengendalian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_kontrol ?></td>

    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Frekuensi Pengendalian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->frekuensi ?></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Tujuan Pengendalian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->tujuan_kontrol ?></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Atribut Pengendalian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->atribut_kontrol ?></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Dokumen Pengendalian Terkait</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->dok_pendukung ?></td>
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
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Tujuan Walkthrough</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= $data->tujuan_walkthrough ?>
        </td>
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
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Prosedur Walkthrough</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= $data->prosedur_walkthrough ?>
        </td>
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
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Kesimpulan Pengujian Rancangan Pengendalian</td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->hasil_kesimpulan ?></td>
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
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Diisiapkan oleh</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Dievaluasi oleh</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Disetujui oleh</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;height: 100px;"><img src="<?= (!empty($data->file_ttd['control_preparer_nid'])) ? $data->file_ttd['control_preparer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;"></td>
        <td style="border: 1px solid black;height: 100px;"><img src="<?= (!empty($data->file_ttd['control_reviewer_nid'])) ? $data->file_ttd['control_reviewer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;"></td>
        <td style="border: 1px solid black;height: 100px;"><img src="<?= (!empty($data->file_ttd['control_reviewer_nid'])) ? $data->file_ttd['control_reviewer_nid'] : "" ?>" alt="" style="width: 100px; padding:10px;"></td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;"><?= $data->preparer_tod ?></td>
        <td style="border: 1px solid black;"><?= $data->reviewer_tod ?></td>
        <td style="border: 1px solid black;"><?= $data->reviewer_tod ?></td>
    </tr>
</table>