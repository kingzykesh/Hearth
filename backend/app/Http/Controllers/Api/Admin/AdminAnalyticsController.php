<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\User;
use App\Models\VoiceSample;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AdminAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $lowRisk = Prediction::where('risk_level', 'Low Risk')->count();
        $highRisk = Prediction::where('risk_level', 'High Risk')->count();

        $completed = Prediction::where('processing_status', 'completed')->count();
        $failed = Prediction::where('processing_status', 'failed')->count();
        $pending = Prediction::where('processing_status', 'pending')->count();

        $totalPredictions = Prediction::count();
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $totalScreenings = VoiceSample::count();

        $avgConfidence = round((float) Prediction::whereNotNull('confidence_score')->avg('confidence_score'), 2);
        $avgRuleScore = round((float) Prediction::whereNotNull('rule_score')->avg('rule_score'), 2);

        $successRate = $totalPredictions > 0
            ? round(($completed / $totalPredictions) * 100, 2)
            : 0;

        $trend7Days = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo)->toDateString();

            $count = VoiceSample::whereDate('created_at', $date)->count();

            return [
                'date' => Carbon::parse($date)->format('M d'),
                'count' => $count,
            ];
        })->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'risk_distribution' => [
                    'low_risk' => $lowRisk,
                    'high_risk' => $highRisk,
                ],
                'processing_distribution' => [
                    'completed' => $completed,
                    'failed' => $failed,
                    'pending' => $pending,
                ],
                'trend_7_days' => $trend7Days,
                'metrics' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'total_screenings' => $totalScreenings,
                    'total_predictions' => $totalPredictions,
                    'avg_confidence' => $avgConfidence,
                    'avg_rule_score' => $avgRuleScore,
                    'success_rate' => $successRate,
                ],
            ],
        ]);
    }
}