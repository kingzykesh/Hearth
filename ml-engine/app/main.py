from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.services.audio_preprocessing import load_and_preprocess_audio
from app.services.feature_extraction import extract_features
from app.services.rule_engine import run_rule_based_screening
from inference.predict_stress import predict_stress
from inference.predict_depression import predict_depression
from inference.predict_combined import predict_combined

app = FastAPI(title="Hearth ML Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clamp(value, min_value=0, max_value=100):
    return max(min_value, min(max_value, value))


def get_hearth_band(score: int) -> str:
    if score >= 90:
        return "Elite Vocal Wellness"
    if score >= 75:
        return "Strong Condition"
    if score >= 60:
        return "Mild Stress Indicators"
    if score >= 45:
        return "Elevated Concern"
    if score >= 25:
        return "Needs Follow-up"
    return "Critical Review Recommended"


def calculate_hearth_score(features: dict, rule_result: dict, stress_result: dict | None):
    rule_score = float(rule_result.get("rule_score", 0))
    model_confidence = float(stress_result.get("confidence", 0)) if stress_result else 0.0
    stress_label = (stress_result.get("label", "") if stress_result else "").lower()

    jitter_penalty = min(float(features.get("jitter_proxy", 0)) * 2.5, 12)
    shimmer_penalty = min(float(features.get("shimmer_proxy", 0)) * 400, 12)
    silence_penalty = min(float(features.get("silence_ratio", 0)) * 20, 10)
    zcr_penalty = min(float(features.get("zcr_mean", 0)) * 60, 10)

    confidence_bonus = min(model_confidence * 0.08, 8)

    label_penalty = 0
    if stress_label == "high":
        label_penalty = 16
    elif stress_label == "moderate":
        label_penalty = 8
    elif stress_label == "low":
        label_penalty = 2

    raw_score = (
        100
        - rule_score
        - jitter_penalty
        - shimmer_penalty
        - silence_penalty
        - zcr_penalty
        - label_penalty
        + confidence_bonus
    )

    hearth_score = int(round(clamp(raw_score, 0, 100)))
    hearth_band = get_hearth_band(hearth_score)

    return {
        "hearth_score": hearth_score,
        "hearth_band": hearth_band,
        "score_breakdown": {
            "rule_score": round(rule_score, 2),
            "jitter_penalty": round(jitter_penalty, 2),
            "shimmer_penalty": round(shimmer_penalty, 2),
            "silence_penalty": round(silence_penalty, 2),
            "zcr_penalty": round(zcr_penalty, 2),
            "label_penalty": round(label_penalty, 2),
            "confidence_bonus": round(confidence_bonus, 2),
        },
    }


@app.get("/")
def root():
    return {"message": "Hearth ML Engine is running"}


@app.post("/analyze")
async def analyze(audio: UploadFile = File(...)):
    try:
        file_bytes = await audio.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

        y, sr = load_and_preprocess_audio(file_bytes, audio.filename, target_sr=16000)
        features = extract_features(y, sr)
        rule_result = run_rule_based_screening(features)

        stress_result = predict_stress(features)
        depression_result = predict_depression(features)
        combined = predict_combined(stress_result, depression_result, rule_result)

        hearth_score_result = calculate_hearth_score(features, rule_result, stress_result)

        return {
            "risk_level": rule_result["risk_level"],
            "confidence_score": rule_result["confidence_score"],
            "summary": combined["combined_summary"],
            "rule_score": rule_result["rule_score"],
            "rule_breakdown": rule_result["rule_breakdown"],
            "notes": rule_result["notes"],
            "model_used": "hearth-xgboost-hybrid-v1",
            "features": features,
            "stress_result": stress_result,
            "depression_result": depression_result,
            "hearth_score": hearth_score_result["hearth_score"],
            "hearth_band": hearth_score_result["hearth_band"],
            "score_breakdown": hearth_score_result["score_breakdown"],
        }

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        print("ANALYZE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")