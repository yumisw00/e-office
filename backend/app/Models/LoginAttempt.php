<?php

namespace App\Models;

class LoginAttempt extends BaseModel
{
    protected $table = 'login_attempts';

    protected $fillable = [
        'ip_address',
        'email',
        'attempt_count',
        'last_attempt_at',
        'is_locked',
        'locked_until',
    ];

    protected $casts = [
        'ip_address' => 'string',
        'email' => 'string',
        'attempt_count' => 'integer',
        'last_attempt_at' => 'datetime',
        'is_locked' => 'boolean',
        'locked_until' => 'datetime',
    ];

    public array $rules = [
        'ip_address' => 'required|string|max:45',
        'email' => 'required|string|max:255',
        'attempt_count' => 'nullable|integer|min:0',
        'last_attempt_at' => 'nullable',
        'is_locked' => 'nullable|boolean',
        'locked_until' => 'nullable',
    ];

    /**
     * Get or create attempt record
     */
    public static function getAttempt(string $ip, string $email): self
    {
        $attempt = self::where('ip_address', $ip)
            ->where('email', $email)
            ->first();

        if (!$attempt) {
            $attempt = self::create([
                'ip_address' => $ip,
                'email' => $email,
            ]);
        }

        return $attempt;
    }

    /**
     * Increment attempt count
     */
    public function incrementAttempt(): void
    {
        $this->attempt_count++;
        $this->last_attempt_at = now();
        $this->save();
    }

    /**
     * Reset attempt
     */
    public function resetAttempt(): void
    {
        $this->attempt_count = 0;
        $this->is_locked = false;
        $this->locked_until = null;
        $this->save();
    }

    /**
     * Lock attempt
     */
    public function lock(int $durationMinutes = 30): void
    {
        $this->is_locked = true;
        $this->locked_until = now()->addMinutes($durationMinutes);
        $this->save();
    }

    /**
     * Check if locked
     */
    public function isLocked(): bool
    {
        return $this->is_locked && $this->locked_until && $this->locked_until->isFuture();
    }
}