<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
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
            'data' => $voiceSample->load('prediction'),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $samples = VoiceSample::where('user_id', $request->user()->id)
            ->with('prediction')
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $samples,
        ]);
    }
}