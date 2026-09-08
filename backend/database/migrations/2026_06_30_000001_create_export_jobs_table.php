<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_jobs', function (Blueprint $table) {
            $table->bigIncrements('id_export_jobs');
            $table->string('job_id', 100)->unique();
            $table->string('status', 20)->default('pending');
            $table->decimal('progress', 8, 2)->default(0);
            $table->unsignedInteger('total_records')->nullable();
            $table->unsignedInteger('processed_records')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->string('created_by_desc', 200)->nullable();
            $table->string('updated_by_desc', 200)->nullable();
            $table->string('deleted_by_desc', 200)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_jobs');
    }
};
