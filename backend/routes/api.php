<?php

use App\Http\Controllers\Api\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminResearchController;
use App\Http\Controllers\Api\Admin\AdminScreeningController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\VoiceSampleController;
use App\Models\User;
use App\Models\VoiceSample;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail']);
    });
});

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | User Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard-summary', function (Request $request) {
        $user = $request->user();

        $latestSample = VoiceSample::where('user_id', $user->id)
            ->with('prediction')
            ->latest()
            ->first();

        $totalScreenings = VoiceSample::where('user_id', $user->id)->count();

        return response()->json([
            'status' => 'success',
            'message' => 'Dashboard summary fetched successfully.',
            'data' => [
                'user_name' => $user->name,
                'total_screenings' => $totalScreenings,

                'last_screening_date' => $latestSample?->uploaded_at ?? $latestSample?->created_at,

                'last_result' => $latestSample?->prediction?->risk_level,
                'last_confidence' => $latestSample?->prediction?->confidence_score,
                'last_rule_score' => $latestSample?->prediction?->rule_score,

                'last_hearth_score' => $latestSample?->prediction?->hearth_score,
                'last_hearth_band' => $latestSample?->prediction?->hearth_band,

                'last_summary' => $latestSample?->prediction?->summary,
                'last_status' => $latestSample?->prediction?->processing_status
                    ?? $latestSample?->processing_status,

                'last_model_used' => $latestSample?->prediction?->model_used,
                'last_feature_payload' => $latestSample?->prediction?->feature_payload,

                'last_checkin_prompt' => $latestSample?->prediction?->checkin_prompt,
                'last_user_note' => $latestSample?->prediction?->user_note,

                'last_ai_coach_summary' => $latestSample?->prediction?->ai_coach_summary,
                'last_ai_recommendations' => $latestSample?->prediction?->ai_recommendations,
                'last_ai_safety_note' => $latestSample?->prediction?->ai_safety_note,

                'email_verified' => !is_null($user->email_verified_at),
            ],
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Voice Samples
    |--------------------------------------------------------------------------
    */
    Route::get('/voice-samples', [VoiceSampleController::class, 'index']);
    Route::post('/voice-samples', [VoiceSampleController::class, 'store']);
    Route::get('/wellness-trend', [VoiceSampleController::class, 'trend']);

    /*
    |--------------------------------------------------------------------------
    | Research Dataset Routes
    |--------------------------------------------------------------------------
    */
    Route::post('/research/consent', [ResearchController::class, 'consent']);
    Route::post('/research/survey', [ResearchController::class, 'survey']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        Route::get('/summary', [AdminDashboardController::class, 'summary']);

        /*
        | Users
        */
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::patch('/users/{id}/toggle-status', [AdminUserController::class, 'toggleStatus']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

        /*
        | Screenings
        */
        Route::get('/screenings', [AdminScreeningController::class, 'index']);
        Route::post('/screenings/{id}/reprocess', [AdminScreeningController::class, 'reprocess']);
        Route::get('/screenings/export', [AdminScreeningController::class, 'export']);

        /*
        | Analytics
        */
        Route::get('/analytics', [AdminAnalyticsController::class, 'index']);

        /*
        | Research Data
        */
        Route::get('/research/stats', [AdminResearchController::class, 'stats']);
        Route::get('/research/export', [AdminResearchController::class, 'export']);
    });
});

/*
|--------------------------------------------------------------------------
| Email Verification
|--------------------------------------------------------------------------
*/
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {

    if (!URL::hasValidSignature($request)) {
        return redirect(env('FRONTEND_URL') . '/auth/verified?verified=0&message=invalid-link');
    }

    $user = User::findOrFail($id);

    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect(env('FRONTEND_URL') . '/auth/verified?verified=0&message=invalid-hash');
    }

    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    return redirect(env('FRONTEND_URL') . '/auth/verified?verified=1');

})->middleware(['signed'])->name('verification.verify');