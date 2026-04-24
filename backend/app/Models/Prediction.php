<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Prediction extends Model
{
    protected $fillable = [
        'user_id',
        'voice_sample_id',
        'risk_level',
        'confidence_score',
        'rule_score',
        'summary',
        'model_used',
        'feature_payload',
        'processing_status',
        'hearth_score',
        'hearth_band',
        'score_breakdown',
        'error_message',
        'checkin_prompt',
        'user_note',
        'ai_coach_summary',
        'ai_recommendations',
        'ai_safety_note',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'confidence_score' => 'decimal:2',
            'rule_score' => 'integer',
            'hearth_score' => 'integer',
            'feature_payload' => 'array',
            'score_breakdown' => 'array',
            'ai_recommendations' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function feature(): HasOne
    {
        return $this->hasOne(Feature::class);
    }

    public function ruleScore(): HasOne
    {
        return $this->hasOne(RuleScore::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wellnessSurvey()
{
    return $this->hasOne(WellnessSurvey::class);
}

    public function voiceSample(): BelongsTo
    {
        return $this->belongsTo(VoiceSample::class);
    }
}