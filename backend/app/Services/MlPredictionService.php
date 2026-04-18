<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class MlPredictionService
{
    public function analyze(string $absoluteFilePath, string $originalFilename): array
    {
        $response = Http::timeout(120)
            ->attach(
                'audio',
                fopen($absoluteFilePath, 'r'),
                $originalFilename
            )
            ->post(config('services.ml_service.base_url') . '/analyze');

        if (! $response->successful()) {
            throw new \Exception('ML service request failed: ' . $response->body());
        }

        return $response->json();
    }
}