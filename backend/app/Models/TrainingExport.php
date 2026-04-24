<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingExport extends Model
{
    protected $fillable = [
        'voice_sample_id',
        'wellness_survey_id',
        'included',
        'exported_at',
        'model_version',
        'export_payload',
    ];

    protected function casts(): array
    {
        return [
            'included' => 'boolean',
            'exported_at' => 'datetime',
            'export_payload' => 'array',
        ];
    }

    public function voiceSample(): BelongsTo
    {
        return $this->belongsTo(VoiceSample::class);
    }

    public function wellnessSurvey(): BelongsTo
    {
        return $this->belongsTo(WellnessSurvey::class);
    }
}