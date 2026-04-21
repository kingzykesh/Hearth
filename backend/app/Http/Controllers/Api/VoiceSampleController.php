<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feature;
use App\Models\Prediction;
use App\Models\RuleScore;
use App\Models\VoiceSample;
use App\Services\MlPredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VoiceSampleController extends Controller
{
    public function __construct(
        protected MlPredictionService $mlPredictionService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'audio' => ['required', 'file', 'mimetypes:audio/webm,audio/wav,audio/mpeg,video/webm', 'max:10240'],
            'duration_seconds' => ['nullable', 'numeric', 'min:1', 'max:60'],
        ]);

        $file = $request->file('audio');

        $extension = $file->getClientOriginalExtension() ?: 'webm';
        $storedFilename = 'voice_' . now()->format('Ymd_His') . '_' . Str::random(10) . '.' . $extension;

        $path = $file->storeAs('voice-samples', $storedFilename, 'public');

        $voiceSample = VoiceSample::create([
            'user_id' => $request->user()->id,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'duration_seconds' => $validated['duration_seconds'] ?? null,
            'processing_status' => 'uploaded',
            'uploaded_at' => now(),
        ]);

        $prediction = Prediction::create([
            'user_id' => $request->user()->id,
            'voice_sample_id' => $voiceSample->id,
            'processing_status' => 'pending',
        ]);

        try {
            $absoluteFilePath = Storage::disk('public')->path($path);

            $mlResult = $this->mlPredictionService->analyze(
                $absoluteFilePath,
                $file->getClientOriginalName()
            );

            $voiceSample->update([
                'processing_status' => 'processed',
            ]);

            $prediction->update([
                'risk_level' => $mlResult['risk_level'] ?? null,
                'confidence_score' => $mlResult['confidence_score'] ?? null,
                'rule_score' => $mlResult['rule_score'] ?? null,
                'summary' => $mlResult['summary'] ?? null,
                'model_used' => $mlResult['model_used'] ?? 'rule-based-signal-processor-v1',
                'feature_payload' => $mlResult['features'] ?? null,
                'processing_status' => 'completed',
                'processed_at' => now(),
                'error_message' => null,
            ]);

            if (!empty($mlResult['features']) && is_array($mlResult['features'])) {
                Feature::updateOrCreate(
                    [
                        'voice_sample_id' => $voiceSample->id,
                    ],
                    [
                        'user_id' => $request->user()->id,
                        'prediction_id' => $prediction->id,
                        'duration_seconds' => $mlResult['features']['duration_seconds'] ?? null,
                        'mfcc_mean' => $mlResult['features']['mfcc_mean'] ?? null,
                        'mfcc_std' => $mlResult['features']['mfcc_std'] ?? null,
                        'mfcc_delta_mean' => $mlResult['features']['mfcc_delta_mean'] ?? null,
                        'mfcc_delta_std' => $mlResult['features']['mfcc_delta_std'] ?? null,
                        'mfcc_delta2_mean' => $mlResult['features']['mfcc_delta2_mean'] ?? null,
                        'mfcc_delta2_std' => $mlResult['features']['mfcc_delta2_std'] ?? null,
                        'spectral_centroid_mean' => $mlResult['features']['spectral_centroid_mean'] ?? null,
                        'spectral_centroid_std' => $mlResult['features']['spectral_centroid_std'] ?? null,
                        'spectral_rolloff_mean' => $mlResult['features']['spectral_rolloff_mean'] ?? null,
                        'spectral_rolloff_std' => $mlResult['features']['spectral_rolloff_std'] ?? null,
                        'spectral_bandwidth_mean' => $mlResult['features']['spectral_bandwidth_mean'] ?? null,
                        'spectral_bandwidth_std' => $mlResult['features']['spectral_bandwidth_std'] ?? null,
                        'rms_mean' => $mlResult['features']['rms_mean'] ?? null,
                        'rms_std' => $mlResult['features']['rms_std'] ?? null,
                        'zcr_mean' => $mlResult['features']['zcr_mean'] ?? null,
                        'zcr_std' => $mlResult['features']['zcr_std'] ?? null,
                    ]
                );
            }

            RuleScore::updateOrCreate(
                [
                    'voice_sample_id' => $voiceSample->id,
                ],
                [
                    'user_id' => $request->user()->id,
                    'prediction_id' => $prediction->id,
                    'total_score' => $mlResult['rule_score'] ?? 0,
                    'energy_instability_score' => $mlResult['rule_breakdown']['energy_instability_score'] ?? null,
                    'mfcc_variability_score' => $mlResult['rule_breakdown']['mfcc_variability_score'] ?? null,
                    'spectral_fluctuation_score' => $mlResult['rule_breakdown']['spectral_fluctuation_score'] ?? null,
                    'zcr_activity_score' => $mlResult['rule_breakdown']['zcr_activity_score'] ?? null,
                    'notes' => !empty($mlResult['notes']) && is_array($mlResult['notes'])
                        ? implode(' ', $mlResult['notes'])
                        : null,
                ]
            );
        } catch (\Throwable $e) {
            $voiceSample->update([
                'processing_status' => 'failed',
            ]);

            $prediction->update([
                'processing_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Voice sample uploaded successfully.',
            'data' => $voiceSample->load(['prediction', 'feature', 'ruleScore']),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $samples = VoiceSample::where('user_id', $request->user()->id)
            ->with(['prediction', 'feature', 'ruleScore'])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $samples,
        ]);
    }
}