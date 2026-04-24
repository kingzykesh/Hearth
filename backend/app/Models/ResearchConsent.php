<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchConsent extends Model
{
    protected $fillable = [
        'user_id',
        'agreed',
        'agreed_at',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'agreed' => 'boolean',
            'agreed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}