<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Credenciales inválidas.']]);
        }

        abort_unless($user->is_admin, 403, 'No tienes permisos para administrar el inventario.');

        return response()->json([
            'token' => $user->createToken('stock-management')->plainTextToken,
            'user' => $user->only(['id', 'name', 'email']),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->only(['id', 'name', 'email', 'is_admin']));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }
}