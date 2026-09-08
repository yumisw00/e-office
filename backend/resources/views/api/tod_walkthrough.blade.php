<!-- <table cellspacing="0" cellpadding="5" width="100%"> -->
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
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Pedoman/Prosedur/Instruksi Kerja</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= nl2br(htmlspecialchars($data->kebijakan)) ?>
        </td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Sampling Dokumen (Tambahan) dan/atau data yang diminta berdasarkan hasil walktrough</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= nl2br(htmlspecialchars($data->sampling_dokumen)) ?>
        </td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Konfirmasi atas aktivitas (end to end process)</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= nl2br(htmlspecialchars($data->konfirmasi_atas_aktivitas)) ?>
        </td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Perubahan Proses Bisnis (Jika ada)</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= nl2br(htmlspecialchars($data->perubahan_proses_bisnis)) ?>
        </td>
    </tr>
    <tr>
        <td></td>
        <td style="background-color: #C00000;border: 1px solid black;color: white;" colspan="3">Risiko dan/atau pengendalian yang belum teridentifikasi pada Eksisting Rancangan</td>
    </tr>
    <tr>
        <td></td>
        <td style="border: 1px solid black;" colspan="3">
            <?= nl2br(htmlspecialchars($data->risiko_belum_teridentifikasi)) ?>
        </td>
    </tr>
</table>