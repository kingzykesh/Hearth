<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('training_exports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('voice_sample_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wellness_survey_id')->nullable()->constrained()->nullOnDelete();

            $table->boolean('included')->default(true);
            $table->timestamp('exported_at')->nullable();
            $table->string('model_version')->nullable();
            $table->json('export_payload')->nullable();

            $table->timestamps();

            $table->unique('voice_sample_id');
            $table->index(['included', 'exported_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_exports');
    }
};