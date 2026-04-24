<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ResearchConsent;
use App\Models\TrainingExport;
use App\Models\WellnessSurvey;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminResearchController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'total_consents' => ResearchConsent::where('agreed', true)->count(),
                'total_surveys' => WellnessSurvey::count(),
                'training_ready_samples' => TrainingExport::where('included', true)->count(),
                'avg_stress_level' => round((float) WellnessSurvey::avg('stress_level'), 2),
                'avg_sleep_quality' => round((float) WellnessSurvey::avg('sleep_quality'), 2),
                'avg_mood_score' => round((float) WellnessSurvey::avg('mood_score'), 2),
                'avg_study_pressure' => round((float) WellnessSurvey::avg('study_pressure'), 2),
                'avg_energy_level' => round((float) WellnessSurvey::avg('energy_level'), 2),
            ],
        ]);
    }

    public function export(): StreamedResponse
    {
        $filename = 'hearth-africa-training-export-' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'anonymous_user_ref',
                'voice_sample_id',
                'prediction_id',
                'stress_level',
                'sleep_quality',
                'mood_score',
                'study_pressure',
                'energy_level',
                'exam_week',
                'time_of_day',
                'hearth_score',
                'risk_level',
                'created_at',
            ]);

            TrainingExport::where('included', true)
                ->with('wellnessSurvey')
                ->chunk(200, function ($exports) use ($handle) {
                    foreach ($exports as $export) {
                        $payload = $export->export_payload ?? [];
                        fputcsv($handle, [
                            $payload['anonymous_user_ref'] ?? null,
                            $payload['voice_sample_id'] ?? null,
                            $payload['prediction_id'] ?? null,
                            $payload['stress_level'] ?? null,
                            $payload['sleep_quality'] ?? null,
                            $payload['mood_score'] ?? null,
                            $payload['study_pressure'] ?? null,
                            $payload['energy_level'] ?? null,
                            isset($payload['exam_week']) ? (int) $payload['exam_week'] : null,
                            $payload['time_of_day'] ?? null,
                            $payload['hearth_score'] ?? null,
                            $payload['risk_level'] ?? null,
                            $payload['created_at'] ?? null,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}