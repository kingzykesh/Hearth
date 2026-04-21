<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(12);

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $user->update([
            'is_active' => !$user->is_active,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $user->is_active
                ? 'User account activated successfully.'
                : 'User account deactivated successfully.',
            'data' => $user,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully.',
        ]);
    }
}