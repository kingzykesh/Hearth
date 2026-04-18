<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'error_message',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'confidence_score' => 'decimal:2',
            'rule_score' => 'integer',
            'feature_payload' => 'array',
            'processed_at' => 'datetime',
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
}