def run_rule_based_screening(features: dict):
    """
    Simple explainable screening logic using handcrafted thresholds.
    This is not diagnosis. It produces a preliminary screening score.
    """

    score = 0
    notes = []

    rms_std = features.get("rms_std", 0)
    mfcc_std = features.get("mfcc_std", 0)
    spectral_bandwidth_std = features.get("spectral_bandwidth_std", 0)
    zcr_mean = features.get("zcr_mean", 0)

    # Energy instability
    if rms_std > 0.08:
        score += 25
        notes.append("Elevated variability detected in voice energy.")

    elif rms_std > 0.04:
        score += 12
        notes.append("Mild variability detected in voice energy.")

    # MFCC instability
    if mfcc_std > 90:
        score += 25
        notes.append("High cepstral variability detected in vocal features.")

    elif mfcc_std > 55:
        score += 12
        notes.append("Moderate cepstral variability detected in vocal features.")

    # Spectral instability
    if spectral_bandwidth_std > 1200:
        score += 25
        notes.append("Significant spectral fluctuation observed.")

    elif spectral_bandwidth_std > 700:
        score += 12
        notes.append("Moderate spectral fluctuation observed.")

    # Noisiness / irregular crossing
    if zcr_mean > 0.18:
        score += 15
        notes.append("Elevated zero-crossing activity may reflect noisier vocal behavior.")

    elif zcr_mean > 0.10:
        score += 8
        notes.append("Mild zero-crossing elevation observed.")

    if score >= 45:
        risk_level = "High Risk"
        confidence_score = min(95, 60 + score * 0.6)
    else:
        risk_level = "Low Risk"
        confidence_score = min(92, 70 + max(score, 5) * 0.4)

    if notes:
        summary = " ".join(notes)
    else:
        summary = "Stable spectral and energy characteristics were observed in this voice sample."

    return {
        "risk_level": risk_level,
        "confidence_score": round(confidence_score, 2),
        "rule_score": score,
        "summary": summary,
    }