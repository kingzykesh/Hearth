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
                        'content' => 'You are Hearth AI Coach, a calm non-diagnostic wellness assistant. You do not diagnose. You explain voice wellness signals in simple, supportive language and give safe practical recommendations.'
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode($data)
                    ],
                ],
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => 'hearth_ai_coach_response',
                        'schema' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'properties' => [
                                'summary' => ['type' => 'string'],
                                'recommendations' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string']
                                ],
                                'safety_note' => ['type' => 'string'],
                            ],
                            'required' => ['summary', 'recommendations', 'safety_note'],
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

        return [
            'summary' => $decoded['summary'] ?? null,
            'recommendations' => $decoded['recommendations'] ?? [],
            'safety_note' => $decoded['safety_note'] ?? 'This is a wellness screening, not a medical diagnosis.',
        ];
    }

    private function fallback(array $data): array
    {
        $score = $data['hearth_score'] ?? null;
        $risk = $data['risk_level'] ?? 'Not available';

        return [
            'summary' => "Your latest screening shows a Hearth Score of {$score} with {$risk}. This suggests your current vocal wellness should be monitored gently over time.",
            'recommendations' => [
                'Take a short rest break.',
                'Drink water and reduce vocal strain.',
                'Check in again later to track your trend.',
            ],
            'safety_note' => 'This is a wellness screening, not a medical diagnosis.',
        ];
    }
}