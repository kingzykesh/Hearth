<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\VoiceSample;
use App\Services\MlPredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

class AdminScreeningController extends Controller
{
    public function __construct(
        protected MlPredictionService $mlPredictionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $screenings = VoiceSample::with(['user:id,name,email', 'prediction', 'feature', 'ruleScore'])
            ->latest()
            ->paginate(12);

        return response()->json([
            'status' => 'success',
            'data' => $screenings,
        ]);
    }

    public function reprocess(int $id): JsonResponse
    {
        $voiceSample = VoiceSample::with('prediction')->findOrFail($id);

        if (!Storage::disk('public')->exists($voiceSample->file_path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stored audio file not found.',
            ], 404);
        }

        $prediction = $voiceSample->prediction;

        if (!$prediction) {
            $prediction = Prediction::create([
                'user_id' => $voiceSample->user_id,
                'voice_sample_id' => $voiceSample->id,
                'processing_status' => 'pending',
            ]);
        }

        try {
            $absoluteFilePath = Storage::disk('public')->path($voiceSample->file_path);

            $mlResult = $this->mlPredictionService->analyze(
                $absoluteFilePath,
                $voiceSample->original_filename
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

            return response()->json([
                'status' => 'success',
                'message' => 'Screening reprocessed successfully.',
            ]);
        } catch (\Throwable $e) {
            $voiceSample->update([
                'processing_status' => 'failed',
            ]);

            $prediction->update([
                'processing_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Reprocessing failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function export()
    {
        $screenings = VoiceSample::with(['user:id,name,email', 'prediction'])
            ->latest()
            ->get();

        $csvHeaders = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=hearth_screenings.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = [
            'ID',
            'User Name',
            'User Email',
            'Original Filename',
            'Processing Status',
            'Risk Level',
            'Confidence Score',
            'Rule Score',
            'Uploaded At',
        ];

        $callback = function () use ($screenings, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($screenings as $screening) {
                fputcsv($file, [
                    $screening->id,
                    $screening->user->name ?? '',
                    $screening->user->email ?? '',
                    $screening->original_filename,
                    $screening->processing_status,
                    $screening->prediction->risk_level ?? '',
                    $screening->prediction->confidence_score ?? '',
                    $screening->prediction->rule_score ?? '',
                    $screening->uploaded_at ?? $screening->created_at,
                ]);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $csvHeaders);
    }
}