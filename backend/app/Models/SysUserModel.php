<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class SysUserModel extends BaseModel
{
    public $table = 'sys_user';

    protected $primaryKey = 'id_user';

    public $fillable = [
        'nid',
        'name',
        'email',
        'email_verified_at',
        'password',
        'remember_token',
        'last_ip',
        'last_login',
        'created_by',
        'updated_by',
        'created_by_desc',
        'modified_by_desc',
        'salt',
        'deleted_by',
        'deleted_by_desc',
        'id_pegawai',
        // === KOLOM BARU KEAMANAN ===
        'failed_login_attempts',
        'need_update_pass',
        'reason_reset_pass',
        'password_updated_at',
        'security_incident_flag',
        'locked_until',
        'password_reset_token',
        'password_reset_expires',
    ];

    public $casts = [
        'name' => 'string',
        'email' => 'string',
        'email_verified_at' => 'datetime',
        'password' => 'string',
        'remember_token' => 'string',
        'last_ip' => 'string',
        'created_by_desc' => 'string',
        'modified_by_desc' => 'string',
        'salt' => 'string',
        'deleted_by_desc' => 'string',
        // === CAST BARU ===
        'failed_login_attempts' => 'integer',
        'need_update_pass' => 'boolean',
        'password_updated_at' => 'datetime',
        'security_incident_flag' => 'boolean',
        'locked_until' => 'datetime',
        'password_reset_expires' => 'datetime',
    ];

    public array $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|string|max:255',
        'email_verified_at' => 'nullable',
        'password' => 'required|string|max:255',
        'remember_token' => 'nullable|string|max:100',
        'created_at' => 'nullable',
        'updated_at' => 'nullable',
        'last_ip' => 'nullable|string|max:30',
        'last_login' => 'nullable',
        'created_by' => 'nullable',
        'updated_by' => 'nullable',
        'created_by_desc' => 'nullable|string|max:200',
        'modified_by_desc' => 'nullable|string|max:200',
        'salt' => 'nullable|string|max:20',
        'deleted_at' => 'nullable',
        'deleted_by' => 'nullable',
        'deleted_by_desc' => 'nullable|string|max:200',
        'id_pegawai' => 'nullable',
        // === RULES BARU ===
        'failed_login_attempts' => 'nullable|integer|min:0',
        'need_update_pass' => 'nullable|boolean',
        'reason_reset_pass' => 'nullable|string|max:1000',
        'password_updated_at' => 'nullable',
        'security_incident_flag' => 'nullable|boolean',
        'locked_until' => 'nullable',
        'password_reset_token' => 'nullable|string|max:255',
        'password_reset_expires' => 'nullable',
    ];

    /**
     * Cek apakah user lockout
     */
    public function isLockedOut(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Cek apakah password dapat digunakan (tidak ada di history)
     * Menggunakan tabel sys_user_password_history
     */
    public function canUsePassword(string $password): bool
    {
        $history = \App\Models\SysUserPasswordHistory::where('id_user', $this->id_user)
            ->orderBy('created_at', 'desc')
            ->limit(config('security.password_history_count', 5))
            ->get();

        foreach ($history as $oldPassword) {
            if (Hash::check($password, $oldPassword->password_hash)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Ambil history password dari tabel terpisah
     */
    public function getPasswordHistory(): array
    {
        return \App\Models\SysUserPasswordHistory::where('id_user', $this->id_user)
            ->orderBy('created_at', 'desc')
            ->limit(config('security.password_history_count', 5))
            ->pluck('password_hash')
            ->toArray();
    }

    /**
     * Tambah password ke history (tabel terpisah)
     */
    public function addToPasswordHistory(string $password): void
    {
        $maxHistory = config('security.password_history_count', 5);

        // Hash password sebelum simpan
        $hashedPassword = Hash::make($password);

        // Simpan ke tabel history
        \App\Models\SysUserPasswordHistory::create([
            'id_user' => $this->id_user,
            'password_hash' => $hashedPassword,
        ]);

        // Hapus password lama jika melebihi max history
        $historyCount = \App\Models\SysUserPasswordHistory::where('id_user', $this->id_user)->count();

        if ($historyCount > $maxHistory) {
            $toDelete = \App\Models\SysUserPasswordHistory::where('id_user', $this->id_user)
                ->orderBy('created_at', 'asc')
                ->limit($historyCount - $maxHistory)
                ->get();

            foreach ($toDelete as $old) {
                $old->delete();
            }
        }
    }

    /**
     * Cek apakah ada insiden keamanan
     */
    public function isSecurityIncident(): bool
    {
        return $this->security_incident_flag ?? false;
    }

    /**
     * Set flag insiden keamanan
     */
    public function setSecurityIncident(bool $flag = true, string $reason = null): void
    {
        $this->security_incident_flag = $flag;
        if ($reason) {
            $this->reason_reset_pass = $reason;
        }
        // Force password change jika ada insiden
        if ($flag) {
            $this->need_update_pass = true;
        }
    }

    /**
     * Clear insiden keamanan
     */
    public function clearSecurityIncident(): void
    {
        $this->security_incident_flag = false;
    }

    /**
     * Reset failed login attempts
     */
    public function resetFailedAttempts(): void
    {
        $this->failed_login_attempts = 0;
    }

    /**
     * Increment failed login attempts
     */
    public function incrementFailedAttempts(): void
    {
        $this->failed_login_attempts = ($this->failed_login_attempts ?? 0) + 1;
    }

    /**
     * Lock user
     */
    public function lockUser(int $durationMinutes = 30): void
    {
        $this->locked_until = now()->addMinutes($durationMinutes);
    }

    /**
     * Unlock user
     */
    public function unlockUser(): void
    {
        $this->locked_until = null;
        $this->failed_login_attempts = 0;
    }

    /**
     * Force password change
     */
    public function forcePasswordChange(string $reason = null): void
    {
        $this->need_update_pass = true;
        $this->reason_reset_pass = $reason;
    }

    /**
     * Clear force password change
     */
    public function clearForcePasswordChange(): void
    {
        $this->need_update_pass = false;
        $this->reason_reset_pass = null;
    }

    public function idPegawai(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\MtSdmPegawai::class, 'id_pegawai');
    }

    public function sysUserGroups(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Models\SysUserGroup::class, 'id_user');
    }

    public function select_user_by_unit(array $id_unit, array $group = [])
    {
        $ret = $this
            ->join('sys_user_group', 'sys_user_group.id_user', '=', 'sys_user.id_user')
            ->join('mt_sdm_jabatan', 'mt_sdm_jabatan.id_jabatan', '=', 'sys_user_group.id_jabatan')
            ->whereIn('mt_sdm_jabatan.id_unit', $id_unit);

        if ($group)
            $ret = $ret->whereIn('sys_user_group.id_group', $group);

        return $ret;
    }
}