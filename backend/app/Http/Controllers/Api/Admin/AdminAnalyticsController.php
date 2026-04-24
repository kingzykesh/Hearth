<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\User;
use App\Models\VoiceSample;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $lowRisk = Prediction::where('risk_level', 'Low Risk')->count();
        $moderateRisk = Prediction::where('risk_level', 'Moderate Risk')->count();
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
        $avgHearthScore = round((float) Prediction::whereNotNull('hearth_score')->avg('hearth_score'), 2);

        $successRate = $totalPredictions > 0
            ? round(($completed / $totalPredictions) * 100, 2)
            : 0;

        $trend7Days = collect(range(6, 0))->map(function ($daysAgo) {
            $date = Carbon::now()->subDays($daysAgo)->toDateString();

            return [
                'date' => Carbon::parse($date)->format('M d'),
                'count' => VoiceSample::whereDate('created_at', $date)->count(),
                'avg_hearth_score' => round((float) Prediction::whereDate('created_at', $date)
                    ->whereNotNull('hearth_score')
                    ->avg('hearth_score'), 2),
            ];
        })->values();

        $scoreBands = [
            'elite_vocal_wellness' => Prediction::whereBetween('hearth_score', [90, 100])->count(),
            'strong_condition' => Prediction::whereBetween('hearth_score', [75, 89])->count(),
            'mild_stress_indicators' => Prediction::whereBetween('hearth_score', [60, 74])->count(),
            'elevated_concern' => Prediction::whereBetween('hearth_score', [45, 59])->count(),
            'needs_follow_up' => Prediction::whereBetween('hearth_score', [25, 44])->count(),
            'critical_review' => Prediction::whereBetween('hearth_score', [0, 24])->count(),
        ];

        $atRiskWatchlist = Prediction::query()
            ->with(['user:id,name,email', 'voiceSample:id,original_filename,created_at'])
            ->whereNotNull('hearth_score')
            ->where(function ($query) {
                $query->where('hearth_score', '<=', 59)
                    ->orWhere('risk_level', 'High Risk');
            })
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($prediction) {
                return [
                    'id' => $prediction->id,
                    'user_name' => $prediction->user?->name,
                    'user_email' => $prediction->user?->email,
                    'hearth_score' => $prediction->hearth_score,
                    'hearth_band' => $prediction->hearth_band,
                    'risk_level' => $prediction->risk_level,
                    'confidence_score' => $prediction->confidence_score,
                    'summary' => $prediction->summary,
                    'created_at' => $prediction->created_at,
                ];
            });

        $recentCoachInsights = Prediction::query()
            ->with('user:id,name,email')
            ->whereNotNull('ai_coach_summary')
            ->latest()
            ->take(8)
            ->get()
            ->map(function ($prediction) {
                return [
                    'id' => $prediction->id,
                    'user_name' => $prediction->user?->name,
                    'user_email' => $prediction->user?->email,
                    'hearth_score' => $prediction->hearth_score,
                    'risk_level' => $prediction->risk_level,
                    'ai_coach_summary' => $prediction->ai_coach_summary,
                    'ai_recommendations' => $prediction->ai_recommendations,
                    'created_at' => $prediction->created_at,
                ];
            });

        $recommendationCounts = [];

        Prediction::whereNotNull('ai_recommendations')
            ->get(['ai_recommendations'])
            ->each(function ($prediction) use (&$recommendationCounts) {
                $recommendations = $prediction->ai_recommendations;

                if (is_string($recommendations)) {
                    $recommendations = json_decode($recommendations, true);
                }

                if (!is_array($recommendations)) {
                    return;
                }

                foreach ($recommendations as $recommendation) {
                    $key = trim((string) $recommendation);

                    if ($key === '') {
                        continue;
                    }

                    $recommendationCounts[$key] = ($recommendationCounts[$key] ?? 0) + 1;
                }
            });

        arsort($recommendationCounts);

        $topRecommendations = collect($recommendationCounts)
            ->take(8)
            ->map(function ($count, $recommendation) {
                return [
                    'recommendation' => $recommendation,
                    'count' => $count,
                ];
            })
            ->values();

        $genderDistribution = User::query()
            ->select('gender', DB::raw('COUNT(*) as total'))
            ->groupBy('gender')
            ->get()
            ->map(function ($item) {
                return [
                    'gender' => $item->gender ?? 'unknown',
                    'total' => (int) $item->total,
                ];
            });

        $ageDistribution = [
            'under_18' => User::whereNotNull('age')->where('age', '<', 18)->count(),
            '18_24' => User::whereBetween('age', [18, 24])->count(),
            '25_34' => User::whereBetween('age', [25, 34])->count(),
            '35_plus' => User::whereNotNull('age')->where('age', '>=', 35)->count(),
            'unknown' => User::whereNull('age')->count(),
        ];

        $aiCohortInsight = $this->generateCohortInsight(
            $avgHearthScore,
            $highRisk,
            $moderateRisk,
            $lowRisk,
            $scoreBands,
            $successRate
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'risk_distribution' => [
                    'low_risk' => $lowRisk,
                    'moderate_risk' => $moderateRisk,
                    'high_risk' => $highRisk,
                ],
                'processing_distribution' => [
                    'completed' => $completed,
                    'failed' => $failed,
                    'pending' => $pending,
                ],
                'score_bands' => $scoreBands,
                'trend_7_days' => $trend7Days,
                'gender_distribution' => $genderDistribution,
                'age_distribution' => $ageDistribution,
                'top_recommendations' => $topRecommendations,
                'at_risk_watchlist' => $atRiskWatchlist,
                'recent_coach_insights' => $recentCoachInsights,
                'ai_cohort_insight' => $aiCohortInsight,
                'metrics' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'total_screenings' => $totalScreenings,
                    'total_predictions' => $totalPredictions,
                    'avg_confidence' => $avgConfidence,
                    'avg_rule_score' => $avgRuleScore,
                    'avg_hearth_score' => $avgHearthScore,
                    'success_rate' => $successRate,
                ],
            ],
        ]);
    }

    private function generateCohortInsight(
        float $avgHearthScore,
        int $highRisk,
        int $moderateRisk,
        int $lowRisk,
        array $scoreBands,
        float $successRate
    ): array {
        $totalRisk = $highRisk + $moderateRisk + $lowRisk;

        $highRiskPercent = $totalRisk > 0
            ? round(($highRisk / $totalRisk) * 100, 2)
            : 0;

        $moderateRiskPercent = $totalRisk > 0
            ? round(($moderateRisk / $totalRisk) * 100, 2)
            : 0;

        if ($avgHearthScore >= 75) {
            $status = 'healthy';
            $summary = 'The current cohort shows strong overall vocal wellness with generally stable screening patterns.';
        } elseif ($avgHearthScore >= 60) {
            $status = 'watch';
            $summary = 'The cohort shows mild stress indicators. Continued monitoring is recommended.';
        } elseif ($avgHearthScore >= 45) {
            $status = 'concern';
            $summary = 'The cohort shows elevated vocal strain patterns. Admin review and wellness intervention may be useful.';
        } else {
            $status = 'urgent';
            $summary = 'The cohort average suggests concerning wellness signals. A structured follow-up process is recommended.';
        }

        $recommendations = [
            'Encourage users to complete regular check-ins for stronger trend accuracy.',
            'Review users in the at-risk watchlist for repeated low Hearth Scores.',
            'Promote rest, hydration, and stress-management guidance across the cohort.',
        ];

        if ($highRiskPercent >= 20) {
            $recommendations[] = 'High-risk screenings are notable; consider targeted wellness outreach.';
        }

        if ($moderateRiskPercent >= 35) {
            $recommendations[] = 'Moderate stress markers are common; consider preventive wellness education.';
        }

        if ($successRate < 85) {
            $recommendations[] = 'Prediction success rate can improve; review failed screenings and audio quality issues.';
        }

        return [
            'status' => $status,
            'summary' => $summary,
            'high_risk_percent' => $highRiskPercent,
            'moderate_risk_percent' => $moderateRiskPercent,
            'recommendations' => $recommendations,
        ];
    }
}