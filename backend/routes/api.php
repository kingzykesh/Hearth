<?php

use App\Http\Controllers\Api\AuthController;
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
                'last_summary' => $latestSample?->prediction?->summary,
                'last_status' => $latestSample?->prediction?->processing_status ?? $latestSample?->processing_status,
                'last_model_used' => $latestSample?->prediction?->model_used,
                'email_verified' => !is_null($user->email_verified_at),
            ],
        ]);
    });

    Route::get('/voice-samples', [VoiceSampleController::class, 'index']);
    Route::post('/voice-samples', [VoiceSampleController::class, 'store']);
});

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    if (! URL::hasValidSignature($request)) {
        return redirect(env('FRONTEND_URL') . '/auth/verified?verified=0&message=invalid-link');
    }

    $user = User::findOrFail($id);

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect(env('FRONTEND_URL') . '/auth/verified?verified=0&message=invalid-hash');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    return redirect(env('FRONTEND_URL') . '/auth/verified?verified=1');
})->middleware(['signed'])->name('verification.verify');