<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rule_scores', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voice_sample_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prediction_id')->nullable()->constrained()->nullOnDelete();

            $table->integer('total_score')->default(0)->nullable();

            $table->integer('energy_instability_score')->nullable();
            $table->integer('mfcc_variability_score')->nullable();
            $table->integer('spectral_fluctuation_score')->nullable();
            $table->integer('zcr_activity_score')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rule_scores');
    }
};