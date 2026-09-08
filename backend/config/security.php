<?php

$twoFactorGroupIdsRaw = trim((string) env('ADMIN_2FA_GROUP_IDS', '1'));
$twoFactorAllGroups = in_array(strtolower($twoFactorGroupIdsRaw), ['all', '*'], true);

$twoFactorGroupIds = $twoFactorAllGroups
    ? []
    : array_values(array_filter(array_map(static function ($value) {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        return (int) $value;
    }, explode(',', $twoFactorGroupIdsRaw))));

return [
    'admin_2fa_enabled' => (bool) env('ADMIN_2FA_ENABLED', false),
    'admin_2fa_all_groups' => $twoFactorAllGroups,
    'admin_2fa_group_ids' => $twoFactorGroupIds ?: [1],
    'admin_2fa_otp_expire_seconds' => (int) env('ADMIN_2FA_OTP_EXPIRE_SECONDS', 300),
    'admin_2fa_max_attempts' => (int) env('ADMIN_2FA_MAX_ATTEMPTS', 5),
    'admin_2fa_max_resends' => (int) env('ADMIN_2FA_MAX_RESENDS', 3),
    'admin_2fa_login_url' => env('ADMIN_2FA_LOGIN_URL', rtrim((string) env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000')), '/') . '/login'),
];
