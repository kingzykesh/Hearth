<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wellness_surveys', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voice_sample_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prediction_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('stress_level');
            $table->unsignedTinyInteger('sleep_quality');
            $table->unsignedTinyInteger('mood_score');
            $table->unsignedTinyInteger('study_pressure');
            $table->unsignedTinyInteger('energy_level');

            $table->boolean('exam_week')->default(false);
            $table->string('time_of_day')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique('voice_sample_id');
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wellness_surveys');
    }
};