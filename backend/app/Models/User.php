<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasMany;


class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
    'name',
    'email',
    'password',
    'gender',
    'age',
    'consent',
    'terms_accepted',
    'is_active',
];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function voiceSamples(): HasMany
{
    return $this->hasMany(VoiceSample::class);
}

public function predictions(): HasMany
{
    return $this->hasMany(Prediction::class);
}

public function features(): HasMany
{
    return $this->hasMany(Feature::class);
}

public function ruleScores()
{
    return $this->hasMany(RuleScore::class);
}

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'consent' => 'boolean',
            'terms_accepted' => 'boolean',
            'is_active' => 'boolean',
            'age' => 'integer',
        ];
    }
}