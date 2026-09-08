<table style="width: 100%; border-collapse: collapse;">

    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="5">
            <h2>TOD</h2>
        </td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="color: red;" colspan="3"><i>Prosedur di bawah ini untuk seluruh sifat pengendalian</i></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Kode Pengendalian</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="2">Deskripsi Pengendalian</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;"><?= $data->rcm_csa_tod->ref_kontrol ?></td>
        <td style="border: 1px solid black;" colspan="2"><?= $data->rcm_csa_tod->deskripsi_kontrol ?></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="2">Kode Pengendalian</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">No.</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Hasil Evaluasi</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Penjelasan</td>
    </tr>
    <?php
    $n = 1;
    foreach ($data->rcm_csa_atribut_kontrol as $rcm_csa_atribut_kontrol) {
    ?>
        <tr>
            <td></td>
            <td style="border: 1px solid black;" colspan="2"><?= $rcm_csa_atribut_kontrol->isi ?></td>
            <td style="border: 1px solid black;"><?= $n ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_atribut[$rcm_csa_atribut_kontrol->id_csa_atribut_kontrol])) ? $data->rcm_csa_tod_atribut[$rcm_csa_atribut_kontrol->id_csa_atribut_kontrol]->hasil : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_atribut[$rcm_csa_atribut_kontrol->id_csa_atribut_kontrol])) ? $data->rcm_csa_tod_atribut[$rcm_csa_atribut_kontrol->id_csa_atribut_kontrol]->keterangan : "" ?></td>
        </tr>
    <?php
        $n++;
    }
    ?>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="2">Bukti Pendukung</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">No.</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Ketersediaan Dokumen</td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;">Keterangan</td>
    </tr>
    <?php
    $n = 1;
    foreach ($data->rcm_csa_dok_pendukung as $rcm_csa_dok_pendukung) {
    ?>
        <tr>
            <td></td>
            <td style="border: 1px solid black;" colspan="2"><?= $rcm_csa_dok_pendukung->isi ?></td>
            <td style="border: 1px solid black;"><?= $n ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_dok_pendukung[$rcm_csa_dok_pendukung->id_csa_dok_pendukung])) ? $data->rcm_csa_tod_dok_pendukung[$rcm_csa_dok_pendukung->id_csa_dok_pendukung]->ketersediaan_dok : "" ?></td>
            <td style="border: 1px solid black;"><?= (!empty($data->rcm_csa_tod_dok_pendukung[$rcm_csa_dok_pendukung->id_csa_dok_pendukung])) ? $data->rcm_csa_tod_dok_pendukung[$rcm_csa_dok_pendukung->id_csa_dok_pendukung]->keterangan : "" ?></td>
        </tr>
    <?php
        $n++;
    }
    ?>
</table>