<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->string('checkin_prompt')->nullable()->after('score_breakdown');
            $table->text('user_note')->nullable()->after('checkin_prompt');
            $table->text('ai_coach_summary')->nullable()->after('user_note');
            $table->json('ai_recommendations')->nullable()->after('ai_coach_summary');
            $table->text('ai_safety_note')->nullable()->after('ai_recommendations');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropColumn([
                'checkin_prompt',
                'user_note',
                'ai_coach_summary',
                'ai_recommendations',
                'ai_safety_note',
            ]);
        });
    }
};