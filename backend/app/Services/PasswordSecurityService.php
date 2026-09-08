<?php

namespace App\Services;

use App\Models\CommonPassword;
use App\Models\SysUserModel;
use Illuminate\Support\Facades\Hash;

class PasswordSecurityService
{
    /**
     * Validate password strength
     */
    public function validatePasswordStrength(string $password): array
    {
        $errors = [];
        $score = 0;

        $config = [
            'min_length' => config('security.password_min_length', 8),
            'require_uppercase' => config('security.password_require_uppercase', true),
            'require_lowercase' => config('security.password_require_lowercase', true),
            'require_number' => config('security.password_require_number', true),
            'require_special' => config('security.password_require_special', true),
        ];

        // Check minimum length
        if (strlen($password) < $config['min_length']) {
            $errors[] = "Password harus minimal {$config['min_length']} karakter";
        } else {
            $score += 20;
        }

        // Check uppercase
        if ($config['require_uppercase']) {
            if (!preg_match('/[A-Z]/', $password)) {
                $errors[] = "Password harus mengandung huruf besar (A-Z)";
            } else {
                $score += 20;
            }
        }

        // Check lowercase
        if ($config['require_lowercase']) {
            if (!preg_match('/[a-z]/', $password)) {
                $errors[] = "Password harus mengandung huruf kecil (a-z)";
            } else {
                $score += 20;
            }
        }

        // Check number
        if ($config['require_number']) {
            if (!preg_match('/[0-9]/', $password)) {
                $errors[] = "Password harus mengandung angka (0-9)";
            } else {
                $score += 20;
            }
        }

        // Check special character
        if ($config['require_special']) {
            if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
                $errors[] = "Password harus mengandung karakter khusus";
            } else {
                $score += 20;
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'score' => $score,
            'level' => $this->getStrengthLevel($score),
        ];
    }

    /**
     * Get strength level text
     */
    private function getStrengthLevel(int $score): string
    {
        if ($score < 40) return 'Lemah';
        if ($score < 60) return 'Cukup';
        if ($score < 80) return 'Kuat';
        return 'Sangat Kuat';
    }

    /**
     * Check if password is common
     */
    public function isCommonPassword(string $password): bool
    {
        // Check in database
        if (CommonPassword::isCommonPassword($password)) {
            return true;
        }

        // Check in common password list (fallback)
        $commonPasswords = [
            'password', '123456', '12345678', 'qwerty', 'abc123',
            'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
            'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
            'bailey', 'passw0rd', 'shadow', '123123', '654321',
            'superman', 'qazwsx', 'michael', 'football', 'password1',
            'password123', 'welcome', 'welcome1', 'admin', 'login',
            'passw0rd123', 'hello', 'charlie', 'donald', 'princess',
        ];

        return in_array(strtolower($password), $commonPasswords);
    }

    /**
     * Check password history (prevent reuse)
     */
    public function checkPasswordHistory(SysUserModel $user, string $password): array
    {
        $history = $user->getPasswordHistory();
        $configHistoryCount = config('security.password_history_count', 5);

        foreach ($history as $oldPassword) {
            if (Hash::check($password, $oldPassword)) {
                return [
                    'valid' => false,
                    'error' => "Password sudah pernah digunakan. Silakan gunakan password yang belum pernah digunakan sebelumnya (minimal {$configHistoryCount} password terakhir)",
                ];
            }
        }

        return ['valid' => true];
    }

    /**
     * Generate password requirements
     */
    public function generatePasswordRequirements(): array
    {
        return [
            'min_length' => config('security.password_min_length', 8),
            'require_uppercase' => config('security.password_require_uppercase', true),
            'require_lowercase' => config('security.password_require_lowercase', true),
            'require_number' => config('security.password_require_number', true),
            'require_special' => config('security.password_require_special', true),
            'history_count' => config('security.password_history_count', 5),
        ];
    }

    /**
     * Full validation
     */
    public function fullValidation(SysUserModel $user, string $password, bool $checkHistory = true): array
    {
        $errors = [];

        // Check strength
        $strengthResult = $this->validatePasswordStrength($password);
        if (!$strengthResult['valid']) {
            $errors = array_merge($errors, $strengthResult['errors']);
        }

        // Check common password
        if ($this->isCommonPassword($password)) {
            $errors[] = "Password yang Anda masukkan terlalu umum. Silakan gunakan password yang lebih unik";
        }

        // Check history
        if ($checkHistory) {
            $historyResult = $this->checkPasswordHistory($user, $password);
            if (!$historyResult['valid']) {
                $errors[] = $historyResult['error'];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'score' => $strengthResult['score'] ?? 0,
            'level' => $strengthResult['level'] ?? 'Lemah',
        ];
    }
}