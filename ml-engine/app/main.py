from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.services.audio_preprocessing import load_and_preprocess_audio
from app.services.feature_extraction import extract_features
from app.services.rule_engine import run_rule_based_screening

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

        y, sr = load_and_preprocess_audio(file_bytes, target_sr=16000)
        features = extract_features(y, sr)
        screening_result = run_rule_based_screening(features)

        return {
            "risk_level": screening_result["risk_level"],
            "confidence_score": screening_result["confidence_score"],
            "summary": screening_result["summary"],
            "rule_score": screening_result["rule_score"],
            "model_used": "rule-based-signal-processor-v1",
            "features": features,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")