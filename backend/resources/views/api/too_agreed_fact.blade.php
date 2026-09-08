<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="border: 1px solid black;background-color: blue; width: 1px;">No.</th>
            <th style="border: 1px solid black;background-color: blue;">Proses Bisnis</th>
            <th style="border: 1px solid black;background-color: blue;">Sub Proses Bisnis</th>
            <th style="border: 1px solid black;background-color: blue;">Referensi Kontrol</th>
            <th style="border: 1px solid black;background-color: blue;">Deskripsi Kontrol</th>
            <th style="border: 1px solid black;background-color: blue;">Lokasi</th>
            <th style="border: 1px solid black;background-color: blue;">Temuan</th>
            <th style="border: 1px solid black;background-color: blue;">Rekomendasi</th>
            <th style="border: 1px solid black;background-color: blue;">Tanggapan BPO</th>
            <th style="border: 1px solid black;background-color: blue;">PIC Unit</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <?php
            $no = 1;
            foreach ($data as $value) {
            ?>
                <td style="border: 1px solid black;"><?= $no ?></td>
                <td style="border: 1px solid black;"><?= $value->proses_bisnis ?></td>
                <td style="border: 1px solid black;"><?= $value->sub_proses_bisnis ?></td>
                <td style="border: 1px solid black;"><?= $value->ref_kontrol ?></td>
                <td style="border: 1px solid black;"><?= $value->deskripsi_kontrol ?></td>
                <td style="border: 1px solid black;"><?= $value->lokasi ?></td>
                <td style="border: 1px solid black;"><?= $value->temuan ?></td>
                <td style="border: 1px solid black;"><?= $value->rekomendasi ?></td>
                <td style="border: 1px solid black;"><?= $value->tanggapan ?></td>
                <td style="border: 1px solid black;"><?= $value->pic ?></td>
            <?php
                $no++;
            }
            ?>
        </tr>
    </tbody>
</table>