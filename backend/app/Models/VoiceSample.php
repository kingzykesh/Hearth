<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;


class VoiceSample extends Model
{
    protected $fillable = [
        'user_id',
        'original_filename',
        'stored_filename',
        'file_path',
        'mime_type',
        'file_size',
        'duration_seconds',
        'processing_status',
        'uploaded_at',
    ];

    public function prediction(): HasOne
{
    return $this->hasOne(Prediction::class);
}

public function ruleScore()
{
    return $this->hasOne(RuleScore::class);
}

public function wellnessSurvey()
{
    return $this->hasOne(WellnessSurvey::class);
}

public function trainingExport()
{
    return $this->hasOne(TrainingExport::class);
}

public function feature(): HasOne
{
    return $this->hasOne(Feature::class);
}
    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'duration_seconds' => 'decimal:2',
            'file_size' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}