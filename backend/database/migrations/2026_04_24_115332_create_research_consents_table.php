<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('agreed')->default(false);
            $table->timestamp('agreed_at')->nullable();
            $table->string('version')->default('campus-beta-v1');
            $table->timestamps();

            $table->unique(['user_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_consents');
    }
};