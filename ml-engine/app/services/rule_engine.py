def run_rule_based_screening(features: dict):
    """
    Simple explainable screening logic using handcrafted thresholds.
    Returns both total score and rule breakdown.
    """

    total_score = 0
    notes = []

    energy_score = 0
    mfcc_score = 0
    spectral_score = 0
    zcr_score = 0

    rms_std = features.get("rms_std", 0)
    mfcc_std = features.get("mfcc_std", 0)
    spectral_bandwidth_std = features.get("spectral_bandwidth_std", 0)
    zcr_mean = features.get("zcr_mean", 0)

    # Energy instability
    if rms_std > 0.08:
        energy_score = 25
        notes.append("Elevated variability detected in voice energy.")
    elif rms_std > 0.04:
        energy_score = 12
        notes.append("Mild variability detected in voice energy.")

    # MFCC variability
    if mfcc_std > 90:
        mfcc_score = 25
        notes.append("High cepstral variability detected in vocal features.")
    elif mfcc_std > 55:
        mfcc_score = 12
        notes.append("Moderate cepstral variability detected in vocal features.")

    # Spectral fluctuation
    if spectral_bandwidth_std > 1200:
        spectral_score = 25
        notes.append("Significant spectral fluctuation observed.")
    elif spectral_bandwidth_std > 700:
        spectral_score = 12
        notes.append("Moderate spectral fluctuation observed.")

    # ZCR activity
    if zcr_mean > 0.18:
        zcr_score = 15
        notes.append("Elevated zero-crossing activity may reflect noisier vocal behavior.")
    elif zcr_mean > 0.10:
        zcr_score = 8
        notes.append("Mild zero-crossing elevation observed.")

    total_score = energy_score + mfcc_score + spectral_score + zcr_score

    if total_score >= 45:
        risk_level = "High Risk"
        confidence_score = min(95, 60 + total_score * 0.6)
    else:
        risk_level = "Low Risk"
        confidence_score = min(92, 70 + max(total_score, 5) * 0.4)

    if notes:
        summary = " ".join(notes)
    else:
        summary = "Stable spectral and energy characteristics were observed in this voice sample."

    return {
        "risk_level": risk_level,
        "confidence_score": round(confidence_score, 2),
        "rule_score": total_score,
        "summary": summary,
        "rule_breakdown": {
            "energy_instability_score": energy_score,
            "mfcc_variability_score": mfcc_score,
            "spectral_fluctuation_score": spectral_score,
            "zcr_activity_score": zcr_score,
        },
        "notes": notes,
    }