<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessSurvey extends Model
{
    protected $fillable = [
        'user_id',
        'voice_sample_id',
        'prediction_id',

        'stress_level',
        'sleep_quality',
        'mood_score',
        'study_pressure',
        'energy_level',

        'exam_week',
        'time_of_day',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'exam_week' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function voiceSample(): BelongsTo
    {
        return $this->belongsTo(VoiceSample::class);
    }

    public function prediction(): BelongsTo
    {
        return $this->belongsTo(Prediction::class);
    }
}