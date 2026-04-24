<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchConsent;
use App\Models\TrainingExport;
use App\Models\VoiceSample;
use App\Models\WellnessSurvey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResearchController extends Controller
{
    public function consent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'agreed' => ['required', 'boolean'],
            'version' => ['nullable', 'string', 'max:100'],
        ]);

        $consent = ResearchConsent::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'version' => $validated['version'] ?? 'campus-beta-v1',
            ],
            [
                'agreed' => $validated['agreed'],
                'agreed_at' => $validated['agreed'] ? now() : null,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => $validated['agreed']
                ? 'Research consent saved successfully.'
                : 'Research consent declined.',
            'data' => $consent,
        ]);
    }

    public function survey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'voice_sample_id' => ['required', 'integer', 'exists:voice_samples,id'],
            'prediction_id' => ['required', 'integer', 'exists:predictions,id'],

            'stress_level' => ['required', 'integer', 'min:1', 'max:10'],
            'sleep_quality' => ['required', 'integer', 'min:1', 'max:10'],
            'mood_score' => ['required', 'integer', 'min:1', 'max:10'],
            'study_pressure' => ['required', 'integer', 'min:1', 'max:10'],
            'energy_level' => ['required', 'integer', 'min:1', 'max:10'],

            'exam_week' => ['nullable', 'boolean'],
            'time_of_day' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $voiceSample = VoiceSample::where('id', $validated['voice_sample_id'])
            ->where('user_id', $request->user()->id)
            ->with('prediction')
            ->firstOrFail();

        if ((int) $voiceSample->prediction?->id !== (int) $validated['prediction_id']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Prediction does not belong to this voice sample.',
            ], 422);
        }

        $consent = ResearchConsent::where('user_id', $request->user()->id)
            ->where('agreed', true)
            ->latest()
            ->first();

        if (!$consent) {
            return response()->json([
                'status' => 'error',
                'message' => 'Research consent is required before submitting survey data.',
            ], 403);
        }

        $survey = WellnessSurvey::updateOrCreate(
            [
                'voice_sample_id' => $voiceSample->id,
            ],
            [
                'user_id' => $request->user()->id,
                'prediction_id' => $validated['prediction_id'],

                'stress_level' => $validated['stress_level'],
                'sleep_quality' => $validated['sleep_quality'],
                'mood_score' => $validated['mood_score'],
                'study_pressure' => $validated['study_pressure'],
                'energy_level' => $validated['energy_level'],

                'exam_week' => $validated['exam_week'] ?? false,
                'time_of_day' => $validated['time_of_day'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        TrainingExport::updateOrCreate(
            [
                'voice_sample_id' => $voiceSample->id,
            ],
            [
                'wellness_survey_id' => $survey->id,
                'included' => true,
                'model_version' => 'hearth-africa-v1-dataset',
                'export_payload' => [
                    'anonymous_user_ref' => 'user_' . hash('sha256', (string) $request->user()->id),
                    'voice_sample_id' => $voiceSample->id,
                    'prediction_id' => $validated['prediction_id'],
                    'stress_level' => $survey->stress_level,
                    'sleep_quality' => $survey->sleep_quality,
                    'mood_score' => $survey->mood_score,
                    'study_pressure' => $survey->study_pressure,
                    'energy_level' => $survey->energy_level,
                    'exam_week' => $survey->exam_week,
                    'time_of_day' => $survey->time_of_day,
                    'hearth_score' => $voiceSample->prediction?->hearth_score,
                    'risk_level' => $voiceSample->prediction?->risk_level,
                    'feature_payload' => $voiceSample->prediction?->feature_payload,
                    'created_at' => now()->toDateTimeString(),
                ],
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Wellness survey submitted successfully.',
            'data' => $survey,
        ], 201);
    }
}