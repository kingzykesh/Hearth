<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\User;
use App\Models\VoiceSample;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $totalScreenings = VoiceSample::count();
        $totalPredictions = Prediction::count();

        $highRiskCount = Prediction::where('risk_level', 'High Risk')->count();
        $lowRiskCount = Prediction::where('risk_level', 'Low Risk')->count();
        $failedPredictions = Prediction::where('processing_status', 'failed')->count();
        $completedPredictions = Prediction::where('processing_status', 'completed')->count();

        $recentUsers = User::latest()->take(5)->get([
            'id',
            'name',
            'email',
            'email_verified_at',
            'created_at',
        ]);

        $recentScreenings = VoiceSample::with(['user:id,name,email', 'prediction'])
            ->latest()
            ->take(8)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'totals' => [
                    'users' => $totalUsers,
                    'screenings' => $totalScreenings,
                    'predictions' => $totalPredictions,
                    'completed_predictions' => $completedPredictions,
                    'failed_predictions' => $failedPredictions,
                ],
                'risk_distribution' => [
                    'low_risk' => $lowRiskCount,
                    'high_risk' => $highRiskCount,
                ],
                'recent_users' => $recentUsers,
                'recent_screenings' => $recentScreenings,
            ],
        ]);
    }
}