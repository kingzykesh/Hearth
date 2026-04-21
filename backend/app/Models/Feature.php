<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feature extends Model
{
    protected $fillable = [
        'user_id',
        'voice_sample_id',
        'prediction_id',
        'duration_seconds',
        'mfcc_mean',
        'mfcc_std',
        'mfcc_delta_mean',
        'mfcc_delta_std',
        'mfcc_delta2_mean',
        'mfcc_delta2_std',
        'spectral_centroid_mean',
        'spectral_centroid_std',
        'spectral_rolloff_mean',
        'spectral_rolloff_std',
        'spectral_bandwidth_mean',
        'spectral_bandwidth_std',
        'rms_mean',
        'rms_std',
        'zcr_mean',
        'zcr_std',
    ];

    protected function casts(): array
    {
        return [
            'duration_seconds' => 'decimal:2',
            'mfcc_mean' => 'decimal:4',
            'mfcc_std' => 'decimal:4',
            'mfcc_delta_mean' => 'decimal:4',
            'mfcc_delta_std' => 'decimal:4',
            'mfcc_delta2_mean' => 'decimal:4',
            'mfcc_delta2_std' => 'decimal:4',
            'spectral_centroid_mean' => 'decimal:4',
            'spectral_centroid_std' => 'decimal:4',
            'spectral_rolloff_mean' => 'decimal:4',
            'spectral_rolloff_std' => 'decimal:4',
            'spectral_bandwidth_mean' => 'decimal:4',
            'spectral_bandwidth_std' => 'decimal:4',
            'rms_mean' => 'decimal:6',
            'rms_std' => 'decimal:6',
            'zcr_mean' => 'decimal:6',
            'zcr_std' => 'decimal:6',
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