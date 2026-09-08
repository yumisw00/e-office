<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyCsrfToken;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Requests\Auth\LoginRequest;
use App\Mail\Email;
use App\Models\SysTwoFactorChallenge;
use App\Services\Auth\LoginCaptchaService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LoginCaptchaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['cache.default' => 'array']);
        config([
            'security.admin_2fa_enabled' => true,
            'security.admin_2fa_all_groups' => true,
            'security.admin_2fa_group_ids' => [],
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.mailers.smtp.username' => 'mailer@example.test',
            'mail.mailers.smtp.password' => 'smtp-app-password',
            'mail.from.address' => 'noreply@example.test',
            'mail.from.name' => 'E-Office',
        ]);
        $this->withoutMiddleware(VerifyCsrfToken::class);
        Mail::fake();
        $this->createAuthSchema();
    }

    public function test_login_captcha_endpoint_membuat_token(): void
    {
        $response = $this->getJson('/login-captcha');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['captcha_token', 'expires_in'],
                'captcha_token',
                'expires_in',
            ]);
    }

    public function test_login_captcha_route_berada_di_web_guest_route(): void
    {
        $route = Route::getRoutes()->match(
            request()->create('/login-captcha', 'GET')
        );

        $this->assertSame(AuthenticatedSessionController::class . '@captcha', $route->getActionName());
        $this->assertContains('guest', $route->gatherMiddleware());
    }

    public function test_login_tanpa_captcha_ditolak_sebelum_authenticate(): void
    {
        $response = $this->postJson('/login', [
            'email' => 'admin@example.test',
            'password' => 'secret',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['captcha_answer'])
            ->assertJsonPath('errors.captcha_answer.0', 'Centang captcha terlebih dahulu.');
    }

    public function test_captcha_token_hanya_bisa_dipakai_sekali(): void
    {
        $captcha = app(LoginCaptchaService::class)->create();
        $token = $captcha['captcha_token'];

        $this->assertTrue(app(LoginCaptchaService::class)->consume($token, 'checked'));
        $this->assertFalse(app(LoginCaptchaService::class)->consume($token, 'checked'));
    }

    public function test_post_login_route_memakai_login_request(): void
    {
        $route = Route::getRoutes()->match(
            request()->create('/login', 'POST')
        );

        $this->assertSame(AuthenticatedSessionController::class . '@store', $route->getActionName());

        $method = new \ReflectionMethod(AuthenticatedSessionController::class, 'store');
        $parameter = $method->getParameters()[0] ?? null;

        $this->assertNotNull($parameter);
        $this->assertSame(LoginRequest::class, $parameter->getType()?->getName());
        $this->assertTrue(method_exists(LoginRequest::class, 'validateCaptcha'));
    }

    public function test_login_valid_semua_role_langsung_login_tanpa_otp(): void
    {
        foreach (['Admin Sistem', 'Admin Konten', 'Pegawai'] as $index => $roleName) {
            $user = $this->seedUserWithRole($roleName, 'user' . $index . '@example.test');
            $captcha = app(LoginCaptchaService::class)->create();

            $response = $this->postJson('/login', [
                'email' => $user['email'],
                'password' => 'secret-password',
                'captcha_token' => $captcha['captcha_token'],
                'captcha_answer' => 'checked',
            ]);

            $response->assertOk()
                ->assertJsonPath('user.email', $user['email'])
                ->assertJsonMissing(['requires_2fa' => true]);

            $this->assertAuthenticated();
            $this->assertDatabaseMissing('sys_two_factor_challenge', [
                'id_user' => $user['id_user'],
                'deleted_at' => null,
            ]);
        }

        Mail::assertNothingSent();
    }

    public function test_login_langsung_tanpa_otp_dengan_2fa_dimatikan(): void
    {
        config(['security.admin_2fa_enabled' => false]);

        $user = $this->seedUserWithRole('Pegawai', 'no-otp@example.test');
        $captcha = app(LoginCaptchaService::class)->create();

        $response = $this->postJson('/login', [
            'email' => $user['email'],
            'password' => 'secret-password',
            'captcha_token' => $captcha['captcha_token'],
            'captcha_answer' => 'checked',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'no-otp@example.test')
            ->assertJsonPath('id_group', $user['id_group'])
            ->assertJsonMissing(['requires_2fa' => true]);

        $this->assertAuthenticated();
        $this->assertDatabaseMissing('sys_two_factor_challenge', [
            'id_user' => $user['id_user'],
            'deleted_at' => null,
        ]);
        Mail::assertNothingSent();
    }

    public function test_login_langsung_berhasil_jika_smtp_tidak_tersedia(): void
    {
        config(['mail.default' => 'log']);

        $user = $this->seedUserWithRole('Admin Sistem', 'mail-log@example.test');
        $captcha = app(LoginCaptchaService::class)->create();

        $response = $this->postJson('/login', [
            'email' => $user['email'],
            'password' => 'secret-password',
            'captcha_token' => $captcha['captcha_token'],
            'captcha_answer' => 'checked',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'mail-log@example.test')
            ->assertJsonMissing(['requires_2fa' => true]);

        $this->assertAuthenticated();
        $this->assertDatabaseMissing('sys_two_factor_challenge', [
            'id_user' => $user['id_user'],
            'deleted_at' => null,
        ]);
        Mail::assertNothingSent();
    }

    public function test_verify_otp_valid_baru_membuat_session_login_penuh(): void
    {
        $user = $this->seedUserWithRole('Admin Konten', 'otp@example.test');
        $challenge = $this->seedChallenge($user, '123456');

        $response = $this->postJson('/2fa/verify', [
            'challenge_id' => $challenge->id,
            'otp_code' => '123456',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'otp@example.test')
            ->assertJsonPath('id_group', $user['id_group'])
            ->assertJsonPath('nama_group', 'Admin Konten')
            ->assertJsonStructure([
                'user',
                'menu',
                'access',
                'accessmethod',
                'id_group',
                'nama_group',
            ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('sys_two_factor_challenge', [
            'id' => $challenge->id,
        ]);
        $this->assertNotNull(SysTwoFactorChallenge::find($challenge->id)->verified_at);
    }

    public function test_otp_salah_atau_sudah_dipakai_return_422(): void
    {
        $user = $this->seedUserWithRole('Pegawai', 'pegawai-otp@example.test');
        $challenge = $this->seedChallenge($user, '123456');

        $this->postJson('/2fa/verify', [
            'challenge_id' => $challenge->id,
            'otp_code' => '000000',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['otp_code']);

        $this->postJson('/2fa/verify', [
            'challenge_id' => $challenge->id,
            'otp_code' => '123456',
        ])->assertOk();

        $this->postJson('/2fa/verify', [
            'challenge_id' => $challenge->id,
            'otp_code' => '123456',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['otp_code']);
    }

    public function test_otp_kedaluwarsa_return_422(): void
    {
        $user = $this->seedUserWithRole('Admin Sistem', 'expired-otp@example.test');
        $challenge = $this->seedChallenge($user, '123456');
        $challenge->forceFill([
            'otp_expires_at' => now()->subMinute(),
        ])->save();

        $this->postJson('/2fa/verify', [
            'challenge_id' => $challenge->id,
            'otp_code' => '123456',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['otp_code'])
            ->assertJsonPath('errors.otp_code.0', 'Kode OTP sudah kedaluwarsa.');
    }

    public function test_resend_otp_guest_endpoint_aktif(): void
    {
        $user = $this->seedUserWithRole('Admin Sistem', 'resend@example.test');
        $challenge = $this->seedChallenge($user, '123456');

        $response = $this->postJson('/2fa/resend', [
            'challenge_id' => $challenge->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('requires_2fa', true)
            ->assertJsonPath('challenge_id', $challenge->id);

        $challenge->refresh();
        $this->assertSame(1, $challenge->resend_count);
        $this->assertNull($challenge->verified_at);
    }

    private function seedUserWithRole(string $roleName, string $email): array
    {
        $groupId = DB::table('sys_group')->insertGetId([
            'nama' => $roleName,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_group');

        $userId = DB::table('sys_user')->insertGetId([
            'name' => $roleName . ' User',
            'email' => $email,
            'password' => Hash::make('secret-password'),
            'need_update_pass' => false,
            'failed_login_attempts' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'id_user');

        DB::table('sys_user_group')->insert([
            'id_user' => $userId,
            'id_group' => $groupId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id_user' => $userId,
            'id_group' => $groupId,
            'email' => $email,
        ];
    }

    private function seedChallenge(array $user, string $otp): SysTwoFactorChallenge
    {
        return SysTwoFactorChallenge::create([
            'id_user' => $user['id_user'],
            'id_group' => $user['id_group'],
            'challenge_type' => 'email_otp',
            'delivery_channel' => 'email',
            'destination' => $user['email'],
            'otp_hash' => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes(5),
            'attempt_count' => 0,
            'max_attempt' => 5,
            'resend_count' => 0,
            'last_sent_at' => now(),
            'context_payload' => [
                'id_group' => $user['id_group'],
                'id_jabatan' => null,
                'id_unit' => null,
                'id_dit_bid' => null,
                'nama_group' => DB::table('sys_group')->where('id_group', $user['id_group'])->value('nama'),
                'nama_jabatan' => null,
            ],
            'created_from_ip' => '127.0.0.1',
            'created_from_agent' => 'phpunit',
        ]);
    }

    private function createAuthSchema(): void
    {
        foreach ([
            'sys_two_factor_challenge',
            'sys_group_action',
            'sys_action',
            'sys_group_menu',
            'sys_menu',
            'mt_sdm_jabatan',
            'sys_user_group',
            'sys_group',
            'sys_user',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('sys_user', function (Blueprint $table) {
            $table->bigIncrements('id_user');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('last_ip', 100)->nullable();
            $table->timestamp('last_login')->nullable();
            $table->unsignedInteger('failed_login_attempts')->default(0);
            $table->boolean('need_update_pass')->default(false);
            $table->string('reason_reset_pass')->nullable();
            $table->boolean('security_incident_flag')->default(false);
            $table->timestamp('locked_until')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_group', function (Blueprint $table) {
            $table->bigIncrements('id_group');
            $table->string('nama', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_user_group', function (Blueprint $table) {
            $table->bigIncrements('id_user_group');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_group');
            $table->unsignedBigInteger('id_jabatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('mt_sdm_jabatan', function (Blueprint $table) {
            $table->bigIncrements('id_jabatan');
            $table->unsignedBigInteger('id_unit')->nullable();
            $table->string('nama')->nullable();
            $table->unsignedBigInteger('id_dit_bid')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_menu', function (Blueprint $table) {
            $table->bigIncrements('id_menu');
            $table->unsignedBigInteger('id_parent_menu')->nullable();
            $table->string('nama')->nullable();
            $table->string('url')->nullable();
            $table->integer('sort')->default(0);
            $table->string('icon')->nullable();
            $table->boolean('is_show')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_group_menu', function (Blueprint $table) {
            $table->bigIncrements('id_group_menu');
            $table->unsignedBigInteger('id_group');
            $table->unsignedBigInteger('id_menu');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_action', function (Blueprint $table) {
            $table->bigIncrements('id_action');
            $table->unsignedBigInteger('id_menu')->nullable();
            $table->string('nama')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_group_action', function (Blueprint $table) {
            $table->bigIncrements('id_group_action');
            $table->unsignedBigInteger('id_group_menu');
            $table->unsignedBigInteger('id_action');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sys_two_factor_challenge', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('id_group')->nullable();
            $table->string('challenge_type', 50)->default('email_otp');
            $table->string('delivery_channel', 30)->default('email');
            $table->string('destination')->nullable();
            $table->string('otp_hash');
            $table->timestamp('otp_expires_at')->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->unsignedInteger('max_attempt')->default(5);
            $table->unsignedInteger('resend_count')->default(0);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('context_payload')->nullable();
            $table->string('created_from_ip', 100)->nullable();
            $table->string('created_from_agent', 1000)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }
}
