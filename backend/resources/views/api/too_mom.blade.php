<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">No. Referensi</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->no_ref : "" ?></td>
        </tr>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">Tanggal</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->tanggal : "" ?></td>
        </tr>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">Lokasi</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->lokasi : "" ?></td>
        </tr>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">Proses Bisnis</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->proses_bisnis : "" ?></td>
        </tr>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">Sub Proses Bisnis</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->sub_proses_bisnis : "" ?> </td>
        </tr>
        <tr>
            <td colspan="2" style="width: 300px;border: 1px solid black;">Business Process Owner (BPO)</td>
            <td style="border: 1px solid black;" colspan="2"><?= (!empty($data)) ? $data->bpo : "" ?> </td>
        </tr>
        <tr>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="3" style="text-align: center;">
                <h2>Auditee</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue; width: 2px;">No</th>
            <th style="background-color: blue;"colspan="2">Nama</th>
            <th style="background-color: blue;">Jabatan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        if (!empty($data->rcm_too_mom_auditee))
            foreach ($data->rcm_too_mom_auditee as $rcm_too_mom_auditee) {
        ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"colspan="2"><?= $rcm_too_mom_auditee->nama ?></td>
                <td style="border: 1px solid black;"><?= $rcm_too_mom_auditee->jabatan ?></td>
            </tr>
        <?php
                $no++;
            }
        ?>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th colspan="3" style="text-align: center;">
                <h2>Lini 2</h2>
            </th>
        </tr>
    </thead>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue; width: 2px;">No</th>
            <th style="background-color: blue;"colspan="2">Nama</th>
            <th style="background-color: blue;">Jabatan</th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        if (!empty($data->rcm_too_mom_spi))
            foreach ($data->rcm_too_mom_spi as $rcm_too_mom_spi) {
        ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"colspan="2"><?= $rcm_too_mom_spi->nama ?></td>
                <td style="border: 1px solid black;"><?= $rcm_too_mom_spi->jabatan ?></td>
            </tr>
        <?php
                $no++;
            }
        ?>
        <tr>
            <td></td>
        </tr>
    </tbody>
</table>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="background-color: blue; width: 2px;">No</th>
            <th style="background-color: blue;" colspan="2">Deskripsi</th>
            <th style="background-color: blue;">No. Referensi Sub Bisnis Proses </th>
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        if (!empty($data->rcm_too_mom_deskripsi))
            foreach ($data->rcm_too_mom_deskripsi as $rcm_too_mom_deskripsi) {
        ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;" colspan="2"><?= $rcm_too_mom_deskripsi->deskripsi ?></td>
                <td style="border: 1px solid black;"><?= $rcm_too_mom_deskripsi->no_ref_sub_bisnis ?></td>
            </tr>
        <?php
                $no++;
            }
        ?>
    </tbody>
</table>
<?php
// dd($data->toArray());
?>