<?php

return [
    'strict' => true,

    // Enable debug mode (to print errors)
    'debug' => false,

    // Service Provider settings
    'sp' => [
        'entityId' => 'https://rms.hutamakarya.com/server/',
        'assertionConsumerService' => [
            'url' => 'https://rms.hutamakarya.com/server/saml/acs',
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        ],
        'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        'x509cert' => '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
        uu8wd+RU4riEmViAqhOLUTpPSPaLtrM=',
        'privateKey' => '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
        uOAQ2UejDvVehcNEvp0QRcG6pYpTeVwU',
    ],

    // IdP settings
    'idp' => [
        'entityId' => 'https://app.onelogin.com/saml/metadata/652f7388-55b1-4ef2-afe3-3e356726f8c8',
        'singleSignOnService' => [
            'url' => 'https://hutama-karya.onelogin.com/trust/saml2/http-redirect/sso/652f7388-55b1-4ef2-afe3-3e356726f8c8',
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],
        'x509cert' => 'MIID2DCCAsCgAwIBAgIUKgQ+Ulz43mP4s6hezzV5a32lSCQwDQYJKoZIhvcNAQEF
        BQAwRDEPMA0GA1UECgwGU0FNQVJBMRUwEwYDVQQLDAxPbmVMb2dpbiBJZFAxGjAY
        BgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMB4XDTI0MDcyNzA5NTI1MVoXDTI5MDcy
        NzA5NTI1MVowRDEPMA0GA1UECgwGU0FNQVJBMRUwEwYDVQQLDAxPbmVMb2dpbiBJ
        ZFAxGjAYBgNVBAMMEU9uZUxvZ2luIEFjY291bnQgMIIBIjANBgkqhkiG9w0BAQEF
        AAOCAQ8AMIIBCgKCAQEAtLzMvCRpvREfViuTHpRT2ZFOzRL53vW4mzbcSurye8Im
        ayY4+WN14FgCJvrfjoQoK6mlGLXV86ywGVkcvstjmX/LHcH92yd/C/wzZCq0XUNs
        3pw/9B4PO+veOhaDc4AWCPuMjV40u3O4p7R/cpMLrOoMsSMCQcSfAJDhhjn8C22n
        00rQKtuW11ju3UgNPJtcHh9KtptaTP4YSVlKgOpjcie51FYB4CvE6U4E6UC+PIGP
        CauzwWgucSFQWGuqV0Lev0vE7Gm8D4m/++9QkHmeectgEK5AGqKApKMYmnNRXi2b
        yXRyvaLXxtCEYuHxwW1+cToXsrHyWC2cfRUwxvMMYQIDAQABo4HBMIG+MAwGA1Ud
        EwEB/wQCMAAwHQYDVR0OBBYEFDeXb4ZNB0uTjDdZJTtb9PntvE/wMH8GA1UdIwR4
        MHaAFDeXb4ZNB0uTjDdZJTtb9PntvE/woUikRjBEMQ8wDQYDVQQKDAZTQU1BUkEx
        FTATBgNVBAsMDE9uZUxvZ2luIElkUDEaMBgGA1UEAwwRT25lTG9naW4gQWNjb3Vu
        dCCCFCoEPlJc+N5j+LOoXs81eWt9pUgkMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG
        9w0BAQUFAAOCAQEAOVQ2lU/KpSWxylh4kigx4r+WWXwjjzGkh/2sN7BLlDfP04gP
        MUrwSnGTJg+JUUWXMFZv+i6duddgp0vfTUy1W7rzC2ElPBr64y3/JI1uKomQZ7kg
        Ge64Al58DKJeZVTwPd+8GgTHaDKRwaiwBm4XHnG7EAGy8v22ACt9VzMgF7PQG6xc
        vXRasSeXO8etYrxTL6BkDLLkUk0YawLivKrtJ5qX/LHN9aEEOre3zZ/aMDwg4e8z
        s/mSuFywkoXY9S9Ic10wPiEuCqKhLeZnq1hfRlqqi6YRiEOCBx8gqN/qXpxl4eKb
        M42kD06Y9bga6PtFBPODQXoZWzsRtv+eigu5wg==',
    ],

    'security' => [
        'authnRequestsSigned' => true,
        'allowRepeatAttributeName' => true,
    ],
];
