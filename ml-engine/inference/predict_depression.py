import joblib
import numpy as np
from pathlib import Path
from training.feature_pipeline import FEATURE_COLUMNS


MODEL_PATH = Path("models/depression/depression_model.pkl")
ENCODER_PATH = Path("models/depression/depression_label_encoder.pkl")


def predict_depression(feature_dict: dict):
    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        return None

    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)

    X = np.array([[feature_dict[col] for col in FEATURE_COLUMNS]])

    pred_idx = model.predict(X)[0]
    pred_label = encoder.inverse_transform([pred_idx])[0]

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0]
        confidence = float(np.max(proba) * 100)
    else:
        confidence = 75.0

    return {
        "label": pred_label,
        "confidence": round(confidence, 2),
    }