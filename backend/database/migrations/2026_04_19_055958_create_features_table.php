<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('features', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voice_sample_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prediction_id')->nullable()->constrained()->nullOnDelete();

            $table->decimal('duration_seconds', 8, 2)->nullable();

            $table->decimal('mfcc_mean', 12, 4)->nullable();
            $table->decimal('mfcc_std', 12, 4)->nullable();
            $table->decimal('mfcc_delta_mean', 12, 4)->nullable();
            $table->decimal('mfcc_delta_std', 12, 4)->nullable();
            $table->decimal('mfcc_delta2_mean', 12, 4)->nullable();
            $table->decimal('mfcc_delta2_std', 12, 4)->nullable();

            $table->decimal('spectral_centroid_mean', 12, 4)->nullable();
            $table->decimal('spectral_centroid_std', 12, 4)->nullable();
            $table->decimal('spectral_rolloff_mean', 12, 4)->nullable();
            $table->decimal('spectral_rolloff_std', 12, 4)->nullable();
            $table->decimal('spectral_bandwidth_mean', 12, 4)->nullable();
            $table->decimal('spectral_bandwidth_std', 12, 4)->nullable();

            $table->decimal('rms_mean', 12, 6)->nullable();
            $table->decimal('rms_std', 12, 6)->nullable();
            $table->decimal('zcr_mean', 12, 6)->nullable();
            $table->decimal('zcr_std', 12, 6)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('features');
    }
};