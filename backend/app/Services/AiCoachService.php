<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiCoachService
{
    public function generate(array $data): array
    {
        $apiKey = config('services.openai.key');
        $model = config('services.openai.model', env('OPENAI_MODEL', 'gpt-4.1-mini'));

        if (!$apiKey) {
            return $this->fallback($data);
        }

        $response = Http::withToken($apiKey)
            ->timeout(45)
            ->post('https://api.openai.com/v1/responses', [
                'model' => $model,
                'input' => [
                    [
                        'role' => 'system',
                        'content' => implode("\n", [
                            'You are Hearth AI Coach, a calm non-diagnostic wellness assistant.',
                            'You help students understand voice wellness signals in simple supportive language.',
                            'You do not diagnose medical or mental health conditions.',
                            'You do not claim the user has anxiety, depression, or any disease.',
                            'You provide practical, safe, student-friendly recommendations.',
                            'Keep your tone warm, clear, and empowering.',
                        ]),
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'task' => 'Generate an expanded AI Coach result for this Hearth voice screening.',
                            'input_data' => $data,
                            'rules' => [
                                'Do not diagnose.',
                                'Do not use fear-based language.',
                                'Mention that voice markers may reflect stress, tiredness, vocal strain, sleep issues, or workload.',
                                'Use the user note if provided.',
                                'Make advice practical for a student.',
                                'Keep recommendations safe and simple.',
                            ],
                        ]),
                    ],
                ],
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => 'hearth_ai_coach_v2_response',
                        'schema' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'properties' => [
                                'summary' => [
                                    'type' => 'string',
                                ],
                                'vocal_wellness_interpretation' => [
                                    'type' => 'string',
                                ],
                                'possible_contributors' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                ],
                                'recommendations' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                ],
                                'recovery_suggestion' => [
                                    'type' => 'string',
                                ],
                                'follow_up_question' => [
                                    'type' => 'string',
                                ],
                                'safety_note' => [
                                    'type' => 'string',
                                ],
                            ],
                            'required' => [
                                'summary',
                                'vocal_wellness_interpretation',
                                'possible_contributors',
                                'recommendations',
                                'recovery_suggestion',
                                'follow_up_question',
                                'safety_note',
                            ],
                        ],
                    ],
                ],
            ]);

        if (!$response->successful()) {
            return $this->fallback($data);
        }

        $jsonText = data_get($response->json(), 'output.0.content.0.text');

        if (!$jsonText) {
            return $this->fallback($data);
        }

        $decoded = json_decode($jsonText, true);

        if (!is_array($decoded)) {
            return $this->fallback($data);
        }

        $possibleContributors = $decoded['possible_contributors'] ?? [];

        if (!is_array($possibleContributors)) {
            $possibleContributors = [];
        }

        $expandedSummary = trim(
            "Summary:\n" .
            ($decoded['summary'] ?? 'Your screening has been reviewed by Hearth AI Coach.') .
            "\n\nVocal Wellness Interpretation:\n" .
            ($decoded['vocal_wellness_interpretation'] ?? 'Your voice markers were interpreted using Hearth wellness signals.') .
            "\n\nPossible Contributors:\n" .
            (!empty($possibleContributors) ? '• ' . implode("\n• ", $possibleContributors) : '• Stress, tiredness, vocal strain, workload, or sleep changes may contribute.') .
            "\n\nRecovery Suggestion:\n" .
            ($decoded['recovery_suggestion'] ?? 'Take a short break, hydrate, and check in again later.') .
            "\n\nFollow-up Question:\n" .
            ($decoded['follow_up_question'] ?? 'What do you think affected your wellness most today?')
        );

        return [
            'summary' => $expandedSummary,
            'recommendations' => $decoded['recommendations'] ?? [],
            'safety_note' => $decoded['safety_note'] ?? 'Hearth provides wellness guidance only and does not provide medical diagnosis.',
        ];
    }

    private function fallback(array $data): array
    {
        $score = $data['hearth_score'] ?? null;
        $band = $data['hearth_band'] ?? 'Not available';
        $risk = $data['risk_level'] ?? 'Not available';
        $userNote = $data['user_note'] ?? null;

        $summary = "Summary:\n";
        $summary .= "Your latest screening shows a Hearth Score of {$score} with {$risk}. ";

        if ($band) {
            $summary .= "Your current band is {$band}. ";
        }

        $summary .= "\n\nVocal Wellness Interpretation:\n";
        $summary .= "Your voice markers may reflect changes in energy, tiredness, vocal strain, workload, or stress. ";

        if ($userNote) {
            $summary .= "Your note also provides helpful context: {$userNote}";
        }

        $summary .= "\n\nPossible Contributors:\n";
        $summary .= "• Sleep quality\n• Academic pressure\n• Hydration\n• Vocal strain\n• General tiredness";

        $summary .= "\n\nRecovery Suggestion:\n";
        $summary .= "Take a short reset break, drink water, reduce unnecessary vocal strain, and check in again later.";

        $summary .= "\n\nFollow-up Question:\n";
        $summary .= "Would you say today’s pressure is mostly academic, emotional, physical, or social?";

        return [
            'summary' => $summary,
            'recommendations' => [
                'Take a 5–10 minute rest break.',
                'Drink water and reduce vocal strain for a while.',
                'Break your next study task into one small step.',
                'Try slow breathing for one minute.',
                'Check in again tomorrow to track your trend.',
            ],
            'safety_note' => 'Hearth provides wellness guidance only and does not provide medical diagnosis.',
        ];
    }
}