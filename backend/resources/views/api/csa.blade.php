<table class="tableku" style="border: 1px; width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399; width:1px;">No</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Ref Kontrol</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Ref Sub Proses</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Kontrol</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Efektifitas CSA </th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Unit </th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Pelaksana Control </th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Status </th>
        </tr>
    </thead>

    <tbody>
        <?php
        $no = 1;
        if (count($data['list']) > 0)
            foreach ($data['list'] as $list) {
        ?>
            <tr>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"><?= $list->ref_kontrol ?></td>
                <td style="border: 1px solid black;"><?= $list->no_sub_proses ?></td>
                <td style="border: 1px solid black;"><?= $list->deskripsi_kontrol ?></td>
                <td style="border: 1px solid black;"><?= $list->efektivitas_csa ?></td>
                <td style="border: 1px solid black;"><?= $list->deskripsi_lokasi ?></td>
                <td style="border: 1px solid black;"><?= $list->control_preparer ?></td>
                <td style="border: 1px solid black;"><?= $list->nama_status ?></td>
            </tr>
        <?php
                $no++;
            } ?>
    </tbody>

</table>