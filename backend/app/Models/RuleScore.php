<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RuleScore extends Model
{
    protected $fillable = [
        'user_id',
        'voice_sample_id',
        'prediction_id',
        'total_score',
        'energy_instability_score',
        'mfcc_variability_score',
        'spectral_fluctuation_score',
        'zcr_activity_score',
        'notes',
    ];

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