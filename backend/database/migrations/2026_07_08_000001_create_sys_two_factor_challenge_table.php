<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sys_two_factor_challenge')) {
            return;
        }

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

            $table->index(['id_user', 'id_group', 'verified_at']);
            $table->index('otp_expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sys_two_factor_challenge');
    }
};
