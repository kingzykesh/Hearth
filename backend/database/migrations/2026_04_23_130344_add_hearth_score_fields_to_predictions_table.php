<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->unsignedTinyInteger('hearth_score')->nullable()->after('rule_score');
            $table->string('hearth_band')->nullable()->after('hearth_score');
            $table->json('score_breakdown')->nullable()->after('feature_payload');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropColumn(['hearth_score', 'hearth_band', 'score_breakdown']);
        });
    }
};