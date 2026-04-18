<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voice_sample_id')->constrained()->cascadeOnDelete();

            $table->string('risk_level')->nullable();
            $table->decimal('confidence_score', 5, 2)->nullable();

            $table->text('summary')->nullable();
            $table->string('model_used')->nullable();

            $table->string('processing_status')->default('pending');
            $table->text('error_message')->nullable();

            $table->timestamp('processed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};