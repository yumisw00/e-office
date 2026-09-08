<table class="tableku" style="border: 1px; width: 100%; border-collapse: collapse;">
    <thead>
        <tr>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">No</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Informasi Proses Bisnis</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Informasi Sub-proses Bisnis</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Referensi Observasi/ Pengendalian Terkait </th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Nama Aktivitas Pengendalian</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Judul Observasi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Detail Observasi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Akun Terkait</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Nilai Terkait yang Terdampak</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Risiko Terkait Observasi</th>
            <th rowspan='2' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Tipe Defisiensi</th>
            <th colspan='7' style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Tindak Lanjut Remediasi</th>
        </tr>
        <tr>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Fungsi Terkait</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Penanggung jawab</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Remediasi</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Detail Remediasi</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Deskripsi Pengendalian Setelah Remediasi</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Target Tanggal Remediasi</th>
            <th style="color: white; border: 1px solid black; padding: 4px; text-align: left; background: #333399;">Apakah rencana remediasi telah disetujui/dikonfirmasi</th>

        </tr>
    </thead>

    <tbody>
        <?php
        $no = 1;
        foreach ($data['list'] as $list) { ?>

            <tr>
                <td style="text-align: center; border: 1px solid black; padding: 4px; text-align: left;"> <?= $no ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['ref_proses'] ?? '' ?> <?= $list['deskripsi_proses'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['no_sub_proses'] ?? '' ?> <?= $list['deskripsi_sub_proses'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['no_ref_remediasi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_kontrol'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['judul_observasi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_temuan'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_akun'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['nilai_terkait'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['ref_risiko'] ?? '' ?> <?= $list['deskripsi_risiko'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['tipe_defisiensi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_lokasi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['control_preparer'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_remediasi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['aktivitas_remediasi'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['deskripsi_kontrol'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= $list['target_penyelesaian'] ?? '' ?></td>
                <td style="border: 1px solid black; padding: 4px; text-align: left;"><?= ($list['status_pengajuan'] == 'approve') ? 'Ya' : 'Tidak' ?></td>
            </tr>

        <?php $no++;
        } ?>
    </tbody>

</table>