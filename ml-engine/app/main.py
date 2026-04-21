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

        return {
            "risk_level": rule_result["risk_level"],
            "confidence_score": rule_result["confidence_score"],
            "summary": combined["combined_summary"],
            "rule_score": rule_result["rule_score"],
            "rule_breakdown": rule_result["rule_breakdown"],
            "notes": rule_result["notes"],
            "model_used": "rule-based-signal-processor-v1 + wellness-models",
            "features": features,
            "stress_result": stress_result,
            "depression_result": depression_result,
        }

    except HTTPException:
        raise

    except Exception as e:
        import traceback
        print("ANALYZE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")