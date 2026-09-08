<table style="border: 1px; width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: center; background: #333399;">No</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Wawancara Control Preparer mengenai bagaimana proses berjalan</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Ref Kontrol</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Nama dan Jabatan yang Diwawancara</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Respon / Jawab</th>
            <!-- <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Bukti</th> -->
        </tr>
    </thead>
    <tbody>
        <?php
        $no = 1;
        foreach ($data as $inquiris) { ?>
            <tr>
                <td style="border: 1px solid black;text-align: center;"><?= $no ?></td>
                <td style="border: 1px solid black;"><?= $inquiris->pertanyaan ?></td>
                <td style="border: 1px solid black;"><?= $inquiris->ref_kontrol ?></td>
                <td style="border: 1px solid black;"><?= $inquiris->jawaban ?></td>
                <td style="border: 1px solid black;"><?= $inquiris->control_preparer_nama . " (" . $inquiris->control_preparer_jabatan . ")" ?></td>
            </tr>

        <?php
            $no++;
        }
        ?>
    </tbody>
</table>