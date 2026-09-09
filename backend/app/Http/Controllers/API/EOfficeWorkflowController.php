<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\ApprovalEmail;
use App\Mail\SuratKeluarTerkirimEmail;
use App\Services\ImmutableAuditTrailLogger;
use App\Services\EOfficeNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class EOfficeWorkflowController extends Controller
{
    public function distributeIncoming(Request $request, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'id_unit_tujuan' => ['nullable', 'string', 'max:50'],
            'id_user_tujuan' => ['nullable', 'integer'],
            'id_users' => ['nullable', 'array'],
            'id_users.*' => ['integer'],
            'catatan' => ['nullable', 'string'],
        ]);

        $surat = $this->findSuratMasuk($id);
        if (!$surat) {
            return $this->notFound('Surat masuk tidak ditemukan.');
        }

        // Distribution is an administrative intake action. Pimpinan and
        // employees continue the workflow through dispositions instead.
        if (!$this->isAdminSession()) {
            return $this->forbidden();
        }

        $recipients = collect($validated['id_users'] ?? [])
            ->push($validated['id_user_tujuan'] ?? null)
            ->filter()
            ->unique()
            ->values();

        if ($recipients->isEmpty() && empty($validated['id_unit_tujuan'])) {
            return response()->json([
                'success' => false,
                'message' => 'Penerima distribusi belum dipilih.',
            ], 422);
        }

        $created = DB::transaction(function () use ($surat, $validated, $recipients) {
            $now = now();
            $rows = collect();

            if ($recipients->isEmpty()) {
                $recipients = collect([null]);
            }

            foreach ($recipients as $idUser) {
                $idDistribusi = DB::table('surat_distribusi')->insertGetId([
                    'id_surat_masuk' => $surat->id,
                    'id_unit_tujuan' => $validated['id_unit_tujuan'] ?? null,
                    'id_user_tujuan' => $idUser,
                    'status' => 'distributed',
                    'catatan' => $validated['catatan'] ?? null,
                    'tanggal_distribusi' => $now,
                    'created_by' => auth()->user()?->id_user,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'id_surat_distribusi');

                $row = DB::table('surat_distribusi')->where('id_surat_distribusi', $idDistribusi)->first();
                $rows->push($row);
                $this->audit('surat_distribusi', $idDistribusi, 'distribute', null, $row);

                if ($idUser) {
                    $this->createNotification(
                        (int) $idUser,
                        'Surat masuk baru',
                        'Ada surat masuk yang perlu dibaca.',
                        '/surat_masuk_pegawai?surat_id=' . $surat->id,
                        ['id_surat_masuk' => $surat->id, 'id_surat_distribusi' => $idDistribusi]
                    );
                }
            }

            $this->updateSuratMasukStatus($surat->id, 'dikirim');

            return $rows;
        });

        foreach ($created as $distribution) {
            if (empty($distribution->id_user_tujuan)) {
                continue;
            }

            $recipient = DB::table('sys_user')
                ->where('id_user', $distribution->id_user_tujuan)
                ->whereNull('deleted_at')
                ->first();

            if ($recipient) {
                $this->sendEmailToUser(
                    $recipient,
                    'Surat Masuk Baru: ' . ($surat->perihal ?? 'Tanpa Perihal'),
                    'Anda menerima distribusi surat masuk baru di sistem E-Office.',
                    [
                        ['label' => 'Nomor Surat', 'value' => $surat->nomor_surat ?? '-'],
                        ['label' => 'Perihal', 'value' => $surat->perihal ?? '-'],
                        ['label' => 'Asal Surat', 'value' => $surat->asal_surat ?? '-'],
                        ['label' => 'Catatan', 'value' => $validated['catatan'] ?? '-'],
                    ],
                    'Buka Surat Masuk',
                    rtrim(config('app.frontend_url'), '/') . '/surat_masuk_pegawai?surat_id=' . $surat->id
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Surat masuk berhasil didistribusikan.',
            'data' => $created,
        ]);
    }

    public function markIncomingRead(Request $request, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'id_surat_distribusi' => ['nullable', 'integer'],
        ]);

        $surat = $this->findSuratMasuk($id);
        if (!$surat) {
            return $this->notFound('Surat masuk tidak ditemukan.');
        }

        $idDistribusi = $validated['id_surat_distribusi'] ?? null;
        $idUser = (int) auth()->user()?->id_user;

        // Security: require either a specific distribusi ID or an authenticated user.
        // Without both, the query could match and update ALL distributions for this letter.
        if (!$idUser) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi pengguna diperlukan.',
            ], 403);
        }

        $distributionQuery = DB::table('surat_distribusi')
            ->where('id_surat_masuk', $surat->id)
            ->where('id_user_tujuan', $idUser)
            ->whereNull('deleted_at');

        if ($idDistribusi) {
            $distributionQuery->where('id_surat_distribusi', $idDistribusi);
        }

        if (!$distributionQuery->exists()) {
            return $this->forbidden();
        }

        DB::transaction(function () use ($surat, $idDistribusi, $idUser) {
            $query = DB::table('surat_distribusi')
                ->where('id_surat_masuk', $surat->id)
                ->where('id_user_tujuan', $idUser)
                ->whereNull('deleted_at');

            if ($idDistribusi) {
                $query->where('id_surat_distribusi', $idDistribusi);
            }

            $beforeRows = $query->get();
            $query->update([
                'status' => 'read',
                'tanggal_dibaca' => now(),
                'updated_at' => now(),
            ]);

            foreach ($beforeRows as $before) {
                $after = DB::table('surat_distribusi')->where('id_surat_distribusi', $before->id_surat_distribusi)->first();
                $this->audit('surat_distribusi', $before->id_surat_distribusi, 'read', $before, $after);
            }

            $hasDisposition = DB::table('surat_disposisi')
                ->where('id_surat_masuk', $surat->id)
                ->whereNull('deleted_at')
                ->whereNotIn('status', ['selesai', 'dibatalkan'])
                ->exists();
            $this->updateSuratMasukStatus($surat->id, $hasDisposition ? 'disposisi' : 'selesai');
            if (!$hasDisposition && !empty($surat->id_surat_keluar)) {
                $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'selesai');
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Surat masuk ditandai sudah dibaca.',
        ]);
    }

    public function completeIncoming(int|string $id): JsonResponse
    {
        $surat = $this->findSuratMasuk($id);
        if (!$surat) {
            return $this->notFound('Surat masuk tidak ditemukan.');
        }

        // Ownership check: only recipient of the distribution or admin can mark complete.
        $currentUserId = (int) auth()->user()?->id_user;
        if (!$this->isAdminSession()) {
            $hasDistribution = DB::table('surat_distribusi')
                ->where('id_surat_masuk', $surat->id)
                ->where('id_user_tujuan', $currentUserId)
                ->whereNull('deleted_at')
                ->exists();
            if (!$hasDistribution) {
                return $this->forbidden();
            }
        }

        $this->updateSuratMasukStatus($surat->id, 'done');

        return response()->json([
            'success' => true,
            'message' => 'Surat masuk ditandai selesai.',
            'data' => DB::table('surat_masuk')->where('id', $surat->id)->first(),
        ]);
    }

    public function archiveIncoming(Request $request, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'lokasi_fisik' => ['nullable', 'string', 'max:255'],
            'tanggal_arsip' => ['nullable', 'date'],
        ]);

        $surat = $this->findSuratMasuk($id);
        if (!$surat) {
            return $this->notFound('Surat masuk tidak ditemukan.');
        }

        $currentUserId = (int) auth()->user()?->id_user;
        $hasDistribution = DB::table('surat_distribusi')
            ->where('id_surat_masuk', $surat->id)
            ->where('id_user_tujuan', $currentUserId)
            ->whereNull('deleted_at')
            ->exists();

        if (!$this->isAdminSession() && (int) ($surat->created_by ?? 0) !== $currentUserId && !$hasDistribution) {
            return $this->forbidden();
        }

        $archive = DB::transaction(function () use ($surat, $validated) {
            $existing = DB::table('surat_arsip')
                ->where('jenis_surat', 'surat_masuk')
                ->where('id_surat_masuk', $surat->id)
                ->whereNull('deleted_at')
                ->first();

            if ($existing) {
                return $existing;
            }

            $idArsip = DB::table('surat_arsip')->insertGetId([
                'jenis_surat' => 'surat_masuk',
                'id_surat_masuk' => $surat->id,
                'nomor_surat' => $surat->nomor_surat,
                'perihal' => $surat->perihal,
                'file_path' => $surat->file_surat,
                'hash_file' => $this->fileHash($surat->file_surat),
                'lokasi_fisik' => $validated['lokasi_fisik'] ?? null,
                'tanggal_arsip' => $validated['tanggal_arsip'] ?? now(),
                'created_by' => auth()->user()?->id_user,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_surat_arsip');

            $archive = DB::table('surat_arsip')->where('id_surat_arsip', $idArsip)->first();
            $this->audit('surat_arsip', $idArsip, 'archive', null, $archive);
            $this->updateSuratMasukStatus($surat->id, 'diarsipkan');

            return $archive;
        });

        return response()->json([
            'success' => true,
            'message' => 'Surat masuk berhasil diarsipkan.',
            'data' => $archive,
        ]);
    }

    public function completeDisposition(Request $request, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'catatan_penyelesaian' => ['nullable', 'string'],
            'file_bukti_path' => ['nullable', 'string', 'max:255'],
        ]);

        $before = DB::table('surat_disposisi')->where('id_surat_disposisi', $id)->whereNull('deleted_at')->first();
        if (!$before) {
            return $this->notFound('Disposisi tidak ditemukan.');
        }

        // Ownership check: only disposition recipient or admin can complete disposition.
        $currentUserId = (int) auth()->user()?->id_user;
        if (!$this->isAdminSession() && (int) ($before->id_penerima ?? 0) !== $currentUserId) {
            return $this->forbidden();
        }

        DB::table('surat_disposisi')->where('id_surat_disposisi', $id)->update([
            'status' => 'selesai',
            'catatan_penyelesaian' => $validated['catatan_penyelesaian'] ?? $before->catatan_penyelesaian,
            'file_bukti_path' => $validated['file_bukti_path'] ?? $before->file_bukti_path,
            'tanggal_selesai' => now(),
            'updated_at' => now(),
        ]);

        $after = DB::table('surat_disposisi')->where('id_surat_disposisi', $id)->first();
        $this->audit('surat_disposisi', $id, 'complete_disposition', $before, $after);

        if ($after->id_surat_masuk) {
            $this->updateSuratMasukStatus($after->id_surat_masuk, 'done');
        }

        if (!empty($after->id_pemberi)) {
            $this->createNotification(
                (int) $after->id_pemberi,
                'Disposisi telah diselesaikan',
                'Disposisi yang Anda berikan telah diselesaikan oleh penerima.',
                '/disposisi/' . $after->id_surat_disposisi,
                ['id_surat_disposisi' => $after->id_surat_disposisi, 'id_surat_masuk' => $after->id_surat_masuk]
            );
            $giver = DB::table('sys_user')
                ->where('id_user', $after->id_pemberi)
                ->whereNull('deleted_at')
                ->first();

            if ($giver) {
                $this->sendEmailToUser(
                    $giver,
                    'Disposisi Telah Diselesaikan',
                    'Disposisi yang Anda berikan telah diselesaikan oleh penerima.',
                    [
                        ['label' => 'Instruksi', 'value' => $after->instruksi ?? '-'],
                        ['label' => 'Catatan Penyelesaian', 'value' => $after->catatan_penyelesaian ?? '-'],
                        ['label' => 'Tanggal Selesai', 'value' => $after->tanggal_selesai ?? '-'],
                    ],
                    'Lihat Disposisi',
                    rtrim(config('app.frontend_url'), '/') . '/disposisi/' . $after->id_surat_disposisi
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Disposisi berhasil diselesaikan.',
            'data' => $after,
        ]);
    }

    public function submitOutgoing(Request $request, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'approvers' => ['nullable', 'array'],
            'approvers.*' => ['integer'],
        ]);

        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        if ((int) $surat->created_by !== (int) auth()->user()?->id_user) {
            return $this->forbidden();
        }

        $approvers = collect($validated['approvers'] ?? [])->filter()->unique()->values();
        if ($approvers->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Minimal satu approver harus dipilih.',
            ], 422);
        }

        DB::transaction(function () use ($surat, $approvers) {
            $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'diproses');

            foreach ($approvers as $index => $idApprover) {
                DB::table('surat_approval')->insert([
                    'id_surat_keluar' => $surat->id_surat_keluar,
                    'id_approver' => $idApprover,
                    'urutan' => $index + 1,
                    'status' => $index === 0 ? 'waiting' : 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        // Send email notification to approvers
        // Approver berikutnya akan menerima email setelah approver aktif menyetujui.
        $this->notifyOutgoingApprover($surat, (int) $approvers->first());
        $this->sendApprovalRequestEmails($surat, $approvers->take(1)->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Surat keluar berhasil diajukan.',
            'data' => DB::table('surat_keluar')->where('id_surat_keluar', $id)->first(),
        ]);
    }

    public function approveOutgoing(Request $request, int|string $id): JsonResponse
    {
        return $this->actOnOutgoingApproval($request, $id, 'approved');
    }

    public function rejectOutgoing(Request $request, int|string $id): JsonResponse
    {
        $request->validate([
            'catatan_revisi' => ['required', 'string'],
        ]);

        return $this->actOnOutgoingApproval($request, $id, 'rejected');
    }

    public function signOutgoing(Request $request, int|string $id): JsonResponse
    {
        $request->validate([
            'pin_code' => ['nullable', 'string', 'max:128'],
            'biometric_token' => ['nullable', 'string', 'max:2048'],
        ]);
        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        if (!empty($surat->id_penandatangan) && (int) $surat->id_penandatangan !== (int) auth()->user()?->id_user) {
            return $this->forbidden();
        }

        if (!in_array($surat->status, ['approved', 'signed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Surat keluar harus berstatus approved sebelum ditandatangani.',
            ], 422);
        }

        $signature = DB::transaction(function () use ($surat) {
            $verificationCode = Str::uuid()->toString();
            $verificationUrl = url('/verify/signature/' . $verificationCode);
            $qrPath = 'digital_signature/qr_' . $surat->id_surat_keluar . '_' . now()->format('YmdHis') . '.svg';
            $signedFilePath = $surat->file_pdf_path ?: $surat->file_draft_path;
            $fileHash = $this->fileHash($signedFilePath) ?: hash('sha256', json_encode([
                'id_surat_keluar' => $surat->id_surat_keluar,
                'nomor_surat' => $surat->nomor_surat,
                'kode_draft' => $surat->kode_draft,
                'perihal' => $surat->perihal,
                'tanggal_surat' => $surat->tanggal_surat,
                'signed_at' => now()->toISOString(),
            ]));

            Storage::put($qrPath, QrCode::format('svg')->size(252)->margin(1)->generate($verificationUrl));

            $idSignature = DB::table('digital_signature')->insertGetId([
                'source_type' => 'surat_keluar',
                'source_id' => $surat->id_surat_keluar,
                'id_penandatangan' => $surat->id_penandatangan ?: auth()->user()?->id_user,
                'certificate_serial' => 'EOFFICE-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(10)),
                'qr_code_path' => $qrPath,
                'signed_file_path' => $signedFilePath,
                'verification_url' => $verificationUrl,
                'hash_file' => $fileHash,
                'signed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_digital_signature');

            // Also update surat_keluar with verification_url and qr_path for easy access
            DB::table('surat_keluar')->where('id_surat_keluar', $surat->id_surat_keluar)->update([
                'qr_code_path' => $qrPath,
                'verification_url' => $verificationUrl,
                'updated_at' => now(),
            ]);

            $signature = DB::table('digital_signature')->where('id_digital_signature', $idSignature)->first();
            $this->audit('digital_signature', $idSignature, 'sign', null, $signature);
            $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'signed');

            return $signature;
        });

        $signerId = (int) (auth()->user()?->id_user ?? 0);
        if (!empty($surat->created_by) && (int) $surat->created_by !== $signerId) {
            $this->createNotification(
                (int) $surat->created_by,
                'Surat keluar telah ditandatangani',
                'Surat "' . ($surat->perihal ?? $surat->nomor_surat ?? 'Tanpa Perihal') . '" telah ditandatangani.',
                '/surat_keluar/detail/' . $surat->id_surat_keluar,
                ['id_surat_keluar' => $surat->id_surat_keluar, 'type' => 'signed']
            );
        }

        $signedSurat = $this->findSuratKeluar($surat->id_surat_keluar) ?? $surat;
        if (($signedSurat->jenis_pengiriman ?? null) === 'internal') {
            $recipientIds = DB::table('surat_keluar_penerima')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->pluck('id_user')
                ->filter()
                ->unique();
            $router = app(SuratKeluarAPIController::class);
            foreach ($recipientIds as $recipientId) {
                $router->routeInternalLetterToRecipient((int) $surat->id_surat_keluar, 'internal', (int) $recipientId);
            }
        } elseif ($this->featureEnabled($signedSurat->kirim_email_otomatis ?? false)) {
            $this->sendOutgoingEmail($signedSurat, $signature);
        }
        $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'dikirim');

        return response()->json([
            'success' => true,
            'message' => 'Tanda tangan digital berhasil dibuat.',
            'data' => $signature,
        ]);
    }

    public function sendOutgoing(Request $request, int|string $id): JsonResponse
    {
        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        if ((int) $surat->created_by !== (int) auth()->user()?->id_user) {
            return $this->forbidden();
        }

        if (!in_array($surat->status, ['signed', 'sent'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Surat keluar harus berstatus signed sebelum dikirim.',
            ], 422);
        }

        $recipients = $this->parseEmailList($surat->tujuan_email);
        $ccRecipients = $this->parseEmailList($surat->tembusan_email ?: $surat->tembusan);
        $attachmentPath = $this->resolveOutgoingAttachment($surat);

        if (empty($recipients)) {
            return response()->json([
                'success' => false,
                'message' => 'Email tujuan belum diisi atau tidak valid.',
            ], 422);
        }

        if (!$attachmentPath) {
            return response()->json([
                'success' => false,
                'message' => 'File surat yang akan dikirim belum tersedia.',
            ], 422);
        }

        $signature = DB::table('digital_signature')
            ->where('source_type', 'surat_keluar')
            ->where('source_id', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->orderByDesc('signed_at')
            ->first();

        try {
            Mail::to($recipients)
                ->cc($ccRecipients)
                ->send(new SuratKeluarTerkirimEmail($surat, $signature, $attachmentPath));
        } catch (\Throwable $exception) {
            Log::error('Gagal mengirim surat keluar melalui SMTP.', [
                'id_surat_keluar' => $surat->id_surat_keluar,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim surat melalui email. Silakan coba lagi nanti.',
            ], 503);
        }

        $payload = [
            'to' => $recipients,
            'cc' => $ccRecipients,
            'subject' => $surat->perihal,
            'message' => 'Surat keluar berhasil dikirim melalui SMTP.',
            'attachment_path' => $attachmentPath,
            'verification_url' => $signature?->verification_url,
            'sent_at' => now()->format('Y-m-d H:i:s'),
        ];

        $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'sent');
        $this->audit('surat_keluar', $surat->id_surat_keluar, 'smtp_send', $surat, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Surat keluar berhasil dikirim melalui email.',
            'data' => $payload,
        ]);
    }

    public function archiveOutgoing(int|string $id): JsonResponse
    {
        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        if ((int) $surat->created_by !== (int) auth()->user()?->id_user) {
            return $this->forbidden();
        }

        $archive = DB::transaction(function () use ($surat) {
            $existing = DB::table('surat_arsip')
                ->where('jenis_surat', 'surat_keluar')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->whereNull('deleted_at')
                ->first();

            if ($existing) {
                return $existing;
            }

            $idArsip = DB::table('surat_arsip')->insertGetId([
                'jenis_surat' => 'surat_keluar',
                'id_surat_keluar' => $surat->id_surat_keluar,
                'nomor_surat' => $surat->nomor_surat,
                'perihal' => $surat->perihal,
                'file_path' => $surat->file_pdf_path ?: $surat->file_draft_path,
                'hash_file' => $this->fileHash($surat->file_pdf_path ?: $surat->file_draft_path),
                'tanggal_arsip' => now(),
                'created_by' => auth()->user()?->id_user,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'id_surat_arsip');

            $archive = DB::table('surat_arsip')->where('id_surat_arsip', $idArsip)->first();
            $this->audit('surat_arsip', $idArsip, 'archive', null, $archive);
            $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'archived');

            return $archive;
        });

        return response()->json([
            'success' => true,
            'message' => 'Surat keluar berhasil diarsipkan.',
            'data' => $archive,
        ]);
    }

    public function outgoingTimeline(int|string $id): JsonResponse
    {
        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        // Ownership check: user must be related to this letter (creator, approver, signer, or admin).
        $currentUserId = (int) auth()->user()?->id_user;
        if (!$this->isAdminSession()) {
            $isCreator = (int) ($surat->created_by ?? 0) === $currentUserId;
            $isApprover = DB::table('surat_approval')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->where('id_approver', $currentUserId)
                ->whereNull('deleted_at')
                ->exists();
            $isSigner = DB::table('digital_signature')
                ->where('source_type', 'surat_keluar')
                ->where('source_id', $surat->id_surat_keluar)
                ->where('id_penandatangan', $currentUserId)
                ->whereNull('deleted_at')
                ->exists();
            if (!$isCreator && !$isApprover && !$isSigner) {
                return $this->forbidden();
            }
        }

        $events = collect([
            $this->timelineItem('created', 'Surat keluar dibuat', $surat->status, $surat->created_at, $surat->created_by, ['perihal' => $surat->perihal]),
        ]);

        DB::table('surat_approval')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->orderBy('urutan')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem('approval', 'Approval surat keluar', $row->status, $row->tanggal_aksi ?? $row->created_at, $row->id_approver, [
                    'id_surat_approval' => $row->id_surat_approval,
                    'urutan' => $row->urutan,
                    'catatan_revisi' => $row->catatan_revisi,
                ]));
            });

        DB::table('digital_signature')
            ->where('source_type', 'surat_keluar')
            ->where('source_id', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem('signed', 'Surat ditandatangani', 'signed', $row->signed_at ?? $row->created_at, $row->id_penandatangan, [
                    'id_digital_signature' => $row->id_digital_signature,
                    'qr_code_path' => $row->qr_code_path,
                    'verification_url' => $row->verification_url,
                ]));
            });

        DB::table('surat_arsip')
            ->where('jenis_surat', 'surat_keluar')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->get()
            ->each(function ($row) use ($events) {
                $events->push($this->timelineItem('archived', 'Surat diarsipkan', 'archived', $row->tanggal_arsip ?? $row->created_at, $row->created_by, [
                    'id_surat_arsip' => $row->id_surat_arsip,
                ]));
            });

        return response()->json([
            'success' => true,
            'data' => $events->filter(fn ($event) => !empty($event['created_at']))->sortBy('created_at')->values()->all(),
        ]);
    }

    private function actOnOutgoingApproval(Request $request, int|string $id, string $action): JsonResponse
    {
        $surat = $this->findSuratKeluar($id);
        if (!$surat) {
            return $this->notFound('Surat keluar tidak ditemukan.');
        }

        $currentUserId = auth()->user()?->id_user;
        if (!$currentUserId) {
            return response()->json([
                'success' => false,
                'message' => 'Autentikasi gagal. Silakan login ulang.',
            ], 401);
        }
        \Log::info("[actOnOutgoingApproval] user_id={$currentUserId}, surat_id={$id}, action={$action}");

        $approval = DB::table('surat_approval')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->where('id_approver', $currentUserId)
            ->when($request->input('id_surat_approval'), fn ($q, $idApproval) => $q->where('id_surat_approval', $idApproval))
            ->when($request->input('id_approver'), fn ($q, $idApprover) => $q->where('id_approver', $idApprover))
            ->whereIn('status', ['waiting', 'pending', 'review'])
            ->orderBy('urutan')
            ->first();

        // Admin Sistem, Admin Konten, and Pimpinan may process the active
        // approval even when legacy data assigned it to another approver.
        if (!$approval && $request->user()) {
            $groupId = session('id_group');
            $isApprovalOperator = DB::table('sys_group')
                ->where('id_group', $groupId)
                ->whereNull('deleted_at')
                ->whereRaw("LOWER(REPLACE(nama, '_', ' ')) IN ('admin sistem', 'admin konten', 'pimpinan')")
                ->exists();
            if ($isApprovalOperator) {
                $approval = DB::table('surat_approval')
                    ->where('id_surat_keluar', $surat->id_surat_keluar)
                    ->whereNull('deleted_at')
                    ->when($request->input('id_surat_approval'), fn ($q, $idApproval) => $q->where('id_surat_approval', $idApproval))
                    ->whereIn('status', ['waiting', 'pending', 'review'])
                    ->orderBy('urutan')
                    ->first();
            }
        }

        \Log::info("[actOnOutgoingApproval] approval query result: " . ($approval ? $approval->id_surat_approval : 'NULL'));
        \Log::info("[actOnOutgoingApproval] all approvals for this surat:", DB::table('surat_approval')
            ->where('id_surat_keluar', $surat->id_surat_keluar)
            ->whereNull('deleted_at')
            ->select('id_surat_approval', 'id_approver', 'status', 'urutan')
            ->get()->toArray());

        if (!$approval) {
            return $this->notFound('Approval aktif tidak ditemukan.');
        }

        $nextApproverId = null;
        $isLastApprover = false;

        DB::transaction(function () use ($surat, $approval, $request, $action, &$nextApproverId, &$isLastApprover) {
            DB::table('surat_approval')->where('id_surat_approval', $approval->id_surat_approval)->update([
                'status' => $action,
                'catatan_revisi' => $action === 'rejected' ? $request->input('catatan_revisi') : $approval->catatan_revisi,
                'tanggal_aksi' => now(),
                'updated_at' => now(),
            ]);

            $after = DB::table('surat_approval')->where('id_surat_approval', $approval->id_surat_approval)->first();
            $this->audit('surat_approval', $approval->id_surat_approval, $action, $approval, $after);

            if ($action === 'rejected') {
                $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'draft');
                return;
            }

            $next = DB::table('surat_approval')
                ->where('id_surat_keluar', $surat->id_surat_keluar)
                ->whereNull('deleted_at')
                ->whereIn('status', ['pending', 'waiting', 'review'])
                ->orderBy('urutan')
                ->first();

            if ($next) {
                $nextApproverId = $next->id_approver;
                DB::table('surat_approval')->where('id_surat_approval', $next->id_surat_approval)->update([
                    'status' => 'waiting',
                    'updated_at' => now(),
                ]);
                $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'review');
            } else {
                $isLastApprover = true;
                $this->updateSuratKeluarStatus($surat->id_surat_keluar, 'approved');
            }
        });

        // Generate QR code AFTER the transaction commits (non-critical, wrapped in try-catch)
        if ($isLastApprover && $this->featureEnabled($surat->generate_qr_code ?? false)) {
            $this->generateApprovalQrCode($surat->id_surat_keluar);
        }

        // Send email notifications AFTER the transaction commits (non-critical, wrapped in try-catch)
        try {
            $this->notifyOutgoingApprovalAction($surat, $action, $nextApproverId, $isLastApprover);
            $this->sendApprovalActionEmails($surat, $approval, $action, $nextApproverId, $isLastApprover);
        } catch (\Throwable $e) {
            Log::warning('Gagal mengirim email notifikasi approval.', [
                'surat_id' => $surat->id_surat_keluar,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $action === 'approved' ? 'Surat keluar berhasil disetujui.' : 'Surat keluar ditolak dan dikembalikan ke draft.',
            'data' => DB::table('surat_keluar')->where('id_surat_keluar', $id)->first(),
        ]);
    }

    private function findSuratMasuk(int|string $id): ?object
    {
        return DB::table('surat_masuk')->where('id', $id)->whereNull('deleted_at')->first();
    }

    private function findSuratKeluar(int|string $id): ?object
    {
        return DB::table('surat_keluar')->where('id_surat_keluar', $id)->whereNull('deleted_at')->first();
    }

    private function updateSuratMasukStatus(int|string $id, string $status): void
    {
        $status = match ($status) {
            'distributed' => 'dikirim',
            'read', 'done' => 'selesai',
            'archived' => 'diarsipkan',
            default => $status,
        };

        $before = DB::table('surat_masuk')->where('id', $id)->first();
        DB::table('surat_masuk')->where('id', $id)->update(['status' => $status, 'updated_at' => now()]);
        $after = DB::table('surat_masuk')->where('id', $id)->first();
        $this->audit('surat_masuk', $id, 'status_' . $status, $before, $after);
    }

    private function updateSuratKeluarStatus(int|string $id, string $status): void
    {
        $before = DB::table('surat_keluar')->where('id_surat_keluar', $id)->first();
        DB::table('surat_keluar')->where('id_surat_keluar', $id)->update(['status' => $status, 'updated_at' => now()]);
        $after = DB::table('surat_keluar')->where('id_surat_keluar', $id)->first();
        $this->audit('surat_keluar', $id, 'status_' . $status, $before, $after);
    }

    private function generateApprovalQrCode(int|string $suratId): void
    {
        try {
            $surat = DB::table('surat_keluar')->where('id_surat_keluar', $suratId)->first();
            if (!$surat) return;

            // Skip if already has QR code with digital_signature record
            if (!empty($surat->qr_code_path)) {
                $exists = DB::table('digital_signature')
                    ->where('source_type', 'surat_keluar_approval')
                    ->where('source_id', $suratId)
                    ->whereNull('deleted_at')
                    ->exists();
                if ($exists) return;
            }

            $verificationCode = Str::uuid()->toString();
            $verificationUrl = url('/verify/signature/' . $verificationCode);
            $qrPath = 'digital_signature/qr_' . $suratId . '_approval_' . now()->format('YmdHis') . '.svg';

            Storage::makeDirectory(dirname('public/' . $qrPath), 0775, true);
            Storage::put($qrPath, QrCode::format('svg')->size(252)->margin(1)->generate($verificationUrl));

            // Create digital_signature record so the QR can be verified
            $fileHash = $this->fileHash($surat->file_pdf_path ?: $surat->file_draft_path)
                ?: hash('sha256', json_encode([
                    'id_surat_keluar' => $surat->id_surat_keluar,
                    'nomor_surat' => $surat->nomor_surat,
                    'kode_draft' => $surat->kode_draft,
                    'perihal' => $surat->perihal,
                    'approved_at' => now()->toISOString(),
                ]));

            DB::table('digital_signature')->insert([
                'source_type' => 'surat_keluar_approval',
                'source_id' => $suratId,
                'id_penandatangan' => $surat->id_penandatangan ?: auth()->user()?->id_user,
                'certificate_serial' => 'EOFFICE-APPROVAL-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(8)),
                'qr_code_path' => $qrPath,
                'signed_file_path' => $surat->file_pdf_path ?: $surat->file_draft_path,
                'verification_url' => $verificationUrl,
                'hash_file' => $fileHash,
                'signed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Only update surat_keluar columns if they exist in the table
            $suratKeluarColumns = DB::getSchemaBuilder()->getColumnListing('surat_keluar');
            $updateFields = [];
            if (in_array('qr_code_path', $suratKeluarColumns)) {
                $updateFields['qr_code_path'] = $qrPath;
            }
            if (in_array('verification_url', $suratKeluarColumns)) {
                $updateFields['verification_url'] = $verificationUrl;
            }
            if (!empty($updateFields)) {
                $updateFields['updated_at'] = now();
                DB::table('surat_keluar')->where('id_surat_keluar', $suratId)->update($updateFields);
            }

            $this->audit('surat_keluar', $suratId, 'qr_code_generated', null, ['qr_code_path' => $qrPath, 'source_type' => 'surat_keluar_approval']);
        } catch (\Throwable $e) {
            Log::warning('Gagal generate QR code approval. Approval tetap dilanjutkan.', [
                'surat_id' => $suratId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function createNotification(int $idUser, string $title, ?string $message, ?string $url, array $payload = []): void
    {
        app(EOfficeNotificationService::class)->send($idUser, $title, $message, $url, $payload);
    }

    private function notifyOutgoingApprover(object $surat, int $approverId): void
    {
        $this->createNotification(
            $approverId,
            'Persetujuan surat menunggu Anda',
            'Surat keluar "' . ($surat->perihal ?? $surat->nomor_surat ?? 'Tanpa Perihal') . '" menunggu persetujuan Anda.',
            '/surat_keluar/detail/' . $surat->id_surat_keluar,
            ['id_surat_keluar' => $surat->id_surat_keluar, 'type' => 'approval_request']
        );
    }

    private function notifyOutgoingApprovalAction(object $surat, string $action, ?int $nextApproverId, bool $isLastApprover): void
    {
        $detailUrl = '/surat_keluar/detail/' . $surat->id_surat_keluar;
        $subject = $surat->perihal ?? $surat->nomor_surat ?? 'Tanpa Perihal';

        $this->createNotification(
            (int) $surat->created_by,
            $action === 'approved' ? 'Surat keluar disetujui' : 'Surat keluar ditolak',
            $action === 'approved'
                ? ($isLastApprover ? "Surat \"{$subject}\" telah disetujui dan siap ditandatangani." : "Surat \"{$subject}\" telah disetujui dan menunggu approver berikutnya.")
                : "Surat \"{$subject}\" ditolak dan memerlukan revisi.",
            $detailUrl,
            ['id_surat_keluar' => $surat->id_surat_keluar, 'type' => 'approval_' . $action]
        );

        if ($action === 'approved' && $nextApproverId) {
            $this->notifyOutgoingApprover($surat, $nextApproverId);
        }

        if ($action === 'approved' && $isLastApprover && !empty($surat->id_penandatangan)
            && (int) $surat->id_penandatangan !== (int) $surat->created_by) {
            $this->createNotification(
                (int) $surat->id_penandatangan,
                'Surat siap ditandatangani',
                "Surat \"{$subject}\" telah disetujui dan menunggu tanda tangan Anda.",
                $detailUrl,
                ['id_surat_keluar' => $surat->id_surat_keluar, 'type' => 'sign_request']
            );
        }
    }

    private function audit(string $table, int|string|null $id, string $action, mixed $oldValues, mixed $newValues): void
    {
        app(ImmutableAuditTrailLogger::class)->log($table, $id, $action, $oldValues, $newValues);
    }

    private function fileHash(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        $fullPath = storage_path('app/' . ltrim($path, '/'));

        return is_file($fullPath) ? hash_file('sha256', $fullPath) : null;
    }

    private function parseEmailList(?string $value): array
    {
        if (!$value) return [];

        return collect(preg_split('/[,;\s]+/', $value))
            ->map(fn ($email) => trim((string) $email))
            ->filter(fn ($email) => filter_var($email, FILTER_VALIDATE_EMAIL))
            ->unique()
            ->values()
            ->all();
    }

    private function resolveOutgoingAttachment(object $surat): ?string
    {
        foreach ([$surat->file_pdf_path, $surat->file_draft_path] as $path) {
            if ($path && Storage::exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function timelineItem(string $type, string $title, ?string $status, ?string $createdAt, $actorId = null, array $payload = []): array
    {
        return [
            'type' => $type,
            'title' => $title,
            'status' => $status,
            'description' => $title,
            'actor' => $this->actorLabel($actorId),
            'target' => $this->targetLabel($payload),
            'created_at' => $createdAt,
            'actor_id' => $actorId,
            'payload' => $payload,
        ];
    }

    private function actorLabel($actorId): ?string
    {
        if (!$actorId) {
            return null;
        }

        try {
            $user = DB::table('sys_user')->where('id_user', $actorId)->first();

            foreach (['name', 'nama', 'username', 'email'] as $column) {
                if (!empty($user->{$column})) {
                    return (string) $user->{$column};
                }
            }
        } catch (\Throwable) {
            //
        }

        return (string) $actorId;
    }

    private function targetLabel(array $payload): ?string
    {
        if (!empty($payload['target'])) {
            return (string) $payload['target'];
        }

        if (!empty($payload['id_approver'])) {
            return $this->actorLabel($payload['id_approver']);
        }

        if (!empty($payload['id_penerima'])) {
            return $this->actorLabel($payload['id_penerima']);
        }

        if (!empty($payload['id_unit_tujuan'])) {
            try {
                $unit = DB::table('mt_sdm_unit')->where('id_unit', $payload['id_unit_tujuan'])->first();

                if (!empty($unit->nama)) {
                    return (string) $unit->nama;
                }
            } catch (\Throwable) {
                //
            }

            return (string) $payload['id_unit_tujuan'];
        }

        return null;
    }

    /**
     * Send email notification to approvers when a letter is submitted.
     */
    private function sendApprovalRequestEmails(object $surat, array $approverIds): void
    {
        $approvers = DB::table('sys_user')
            ->whereIn('id_user', $approverIds ?? [])
            ->whereNull('deleted_at')
            ->get();

        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $detailUrl = $frontendUrl . '/surat_keluar/detail/' . $surat->id_surat_keluar;

        foreach ($approvers as $approver) {
            if (empty($approver->email) || !filter_var($approver->email, FILTER_VALIDATE_EMAIL)) continue;

            try {
                Mail::to($approver->email)->send(new ApprovalEmail(
                    subject: 'Persetujuan Surat: ' . ($surat->perihal ?? 'Tanpa Perihal'),
                    greeting: 'Yth. ' . ($approver->name ?? $approver->email),
                    body: 'Anda memiliki surat keluar yang menunggu persetujuan Anda di sistem E-Office.',
                    detailRows: [
                        ['label' => 'Nomor Surat', 'value' => $surat->nomor_surat ?? $surat->kode_draft ?? '-'],
                        ['label' => 'Perihal', 'value' => $surat->perihal ?? '-'],
                        ['label' => 'Tanggal', 'value' => $surat->tanggal_surat ?? '-'],
                        ['label' => 'Pengirim', 'value' => $this->actorLabel($surat->created_by) ?? '-'],
                    ],
                    actionText: 'Lihat & Setujui Surat',
                    actionUrl: $detailUrl,
                    footerNote: 'Email ini dikirim secara otomatis oleh sistem E-Office.',
                ));
            } catch (\Throwable $e) {
                Log::warning('Gagal mengirim email notifikasi approval request.', [
                    'surat_id' => $surat->id_surat_keluar,
                    'approver_id' => $approver->id_user,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Send email notification after an approval action (approve/reject).
     */
    private function sendApprovalActionEmails(
        object $surat,
        object $approval,
        string $action,
        ?int $nextApproverId,
        bool $isLastApprover
    ): void {
        $approver = DB::table('sys_user')
            ->where('id_user', $approval->id_approver)
            ->whereNull('deleted_at')
            ->first();

        $creator = DB::table('sys_user')
            ->where('id_user', $surat->created_by)
            ->whereNull('deleted_at')
            ->first();

        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $detailUrl = $frontendUrl . '/surat_keluar/detail/' . $surat->id_surat_keluar;

        // 1. Notify creator about the action
        if ($creator && !empty($creator->email)) {
            $this->sendEmailToUser(
                $creator,
                $action === 'approved'
                    ? ($isLastApprover
                        ? 'Surat Disetujui - Menunggu Tanda Tangan'
                        : 'Surat Disetujui - Menunggu Approver Berikutnya')
                    : 'Surat Ditolak - Revisi Diperlukan',
                $action === 'approved'
                    ? ($isLastApprover
                        ? 'Surat Anda telah disetujui oleh seluruh approver dan siap untuk ditandatangani.'
                        : 'Surat Anda telah disetujui. Surat menunggu persetujuan dari approver berikutnya.')
                    : 'Surat Anda telah ditolak. Mohon perbaiki sesuai catatan revisi.',
                [
                    ['label' => 'Nomor Surat', 'value' => $surat->nomor_surat ?? $surat->kode_draft ?? '-'],
                    ['label' => 'Perihal', 'value' => $surat->perihal ?? '-'],
                    ['label' => 'Status', 'value' => $action === 'approved' ? '<span style="color:#16a34a;font-weight:bold;">Disetujui</span>' : '<span style="color:#dc2626;font-weight:bold;">Ditolak</span>'],
                    ...($action === 'rejected' && !empty($approval->catatan_revisi)
                        ? [['label' => 'Catatan Revisi', 'value' => htmlspecialchars($approval->catatan_revisi)]]
                        : []),
                ],
                $action === 'approved' && $isLastApprover ? 'Tanda Tangani Surat' : 'Lihat Detail',
                $detailUrl
            );
        }

        // 2. Notify next approver if there's one waiting
        if ($isLastApprover) {
            // All approved - notify creator that it's ready for signing
        } elseif ($nextApproverId) {
            $nextApprover = DB::table('sys_user')
                ->where('id_user', $nextApproverId)
                ->whereNull('deleted_at')
                ->first();

            if ($nextApprover && !empty($nextApprover->email)) {
                $this->sendEmailToUser(
                    $nextApprover,
                    'Menunggu Persetujuan Anda: ' . ($surat->perihal ?? 'Tanpa Perihal'),
                    'Surat keluar berikut menunggu persetujuan Anda.',
                    [
                        ['label' => 'Nomor Surat', 'value' => $surat->nomor_surat ?? $surat->kode_draft ?? '-'],
                        ['label' => 'Perihal', 'value' => $surat->perihal ?? '-'],
                        ['label' => 'Tanggal', 'value' => $surat->tanggal_surat ?? '-'],
                        ['label' => 'Pengirim', 'value' => $this->actorLabel($surat->created_by) ?? '-'],
                    ],
                    'Lihat & Setujui Surat',
                    $detailUrl
                );
            }
        }
    }

    /**
     * Send email for outgoing letter with attachment (auto or manual).
     */
    private function sendOutgoingEmail(object $surat, ?object $signature): void
    {
        $recipients = $this->parseEmailList($surat->tujuan_email);
        $ccRecipients = $this->parseEmailList($surat->tembusan_email ?: $surat->tembusan);
        $attachmentPath = $this->resolveOutgoingAttachment($surat);

        if (empty($recipients)) {
            Log::warning('Tidak ada email tujuan untuk kirim otomatis.', [
                'surat_id' => $surat->id_surat_keluar,
            ]);
            return;
        }

        try {
            Mail::to($recipients)
                ->cc($ccRecipients)
                ->send(new SuratKeluarTerkirimEmail($surat, $signature, $attachmentPath));
        } catch (\Throwable $e) {
            Log::error('Gagal mengirim surat keluar otomatis via SMTP.', [
                'id_surat_keluar' => $surat->id_surat_keluar,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    private function featureEnabled(mixed $value): bool
    {
        return in_array($value, [true, 1, '1', 't', 'true', 'on', 'yes'], true);
    }

    /**
     * Helper to send email to a user object.
     */
    private function sendEmailToUser(
        object $user,
        string $subject,
        string $body,
        array $detailRows = [],
        ?string $actionText = null,
        ?string $actionUrl = null,
        ?string $footerNote = null
    ): void {
        if (empty($user->email) || !filter_var($user->email, FILTER_VALIDATE_EMAIL)) return;

        try {
            Mail::to($user->email)->send(new ApprovalEmail(
                subject: $subject,
                greeting: 'Yth. ' . ($user->name ?? $user->email),
                body: $body,
                detailRows: $detailRows,
                actionText: $actionText,
                actionUrl: $actionUrl,
                footerNote: $footerNote ?? 'Email ini dikirim secara otomatis oleh sistem E-Office.',
            ));
        } catch (\Throwable $e) {
            Log::warning('Gagal mengirim email notifikasi.', [
                'user_id' => $user->id_user ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if the current session belongs to an admin group.
     * Used for ownership checks that allow admin bypass.
     */
    private function isAdminSession(): bool
    {
        $namaGroup = strtolower(trim((string) (session('nama_group') ?? '')));
        $normalized = str_replace(['_', '-'], ' ', $namaGroup);
        if (in_array($normalized, ['admin sistem', 'admin konten', 'admin kontak'], true)) {
            return true;
        }

        $groupId = session('id_group');
        $groupQuery = DB::table('sys_group')
            ->whereNull('deleted_at')
            ->whereRaw("LOWER(REPLACE(REPLACE(nama, '_', ' '), '-', ' ')) IN ('admin sistem', 'admin konten', 'admin kontak')");
        if ($groupId && (clone $groupQuery)->where('id_group', $groupId)->exists()) {
            return true;
        }

        $userId = auth()->user()?->id_user ?? auth()->id();
        return $userId && $groupQuery
            ->join('sys_user_group', 'sys_user_group.id_group', '=', 'sys_group.id_group')
            ->where('sys_user_group.id_user', $userId)
            ->whereNull('sys_user_group.deleted_at')
            ->exists();
    }

    private function notFound(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    private function forbidden(): JsonResponse
    {
        return response()->json(['message' => 'Forbidden.'], 403);
    }
}
