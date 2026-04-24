import sys
import joblib
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from training.feature_pipeline import FEATURE_COLUMNS
from training.trainers.stress_trainer import build_stress_dataframe


RF_MODEL_PATH = Path("models/stress/stress_model_rf.pkl")
GB_MODEL_PATH = Path("models/stress/stress_model_gb.pkl")
XGB_MODEL_PATH = Path("models/stress/stress_model_xgb.pkl")
BEST_MODEL_PATH = Path("models/stress/stress_model.pkl")
ENCODER_PATH = Path("models/stress/stress_label_encoder.pkl")
CSV_PATH = Path("datasets/processed/stress_features.csv")


def train_and_evaluate(model, model_name, X_train, X_test, y_train, y_test, label_encoder):
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)

    print(f"\n{model_name} Accuracy:", round(acc, 4))
    print(classification_report(y_test, preds, target_names=label_encoder.classes_))

    return model, acc


def main():
    force_rebuild = "--rebuild-features" in sys.argv

    if force_rebuild:
        print("Force rebuilding stress features from raw audio...")
    else:
        print("Using cached stress features if available...")

    df = build_stress_dataframe(force_rebuild=force_rebuild)

    if df.empty:
        raise ValueError("No valid stress data available for training.")

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CSV_PATH, index=False)

    X = df[FEATURE_COLUMNS]
    y_raw = df["label"]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    gb_model = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=3,
        random_state=42,
    )

    xgb_model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    rf_model, rf_acc = train_and_evaluate(
        rf_model, "RandomForest", X_train, X_test, y_train, y_test, label_encoder
    )

    gb_model, gb_acc = train_and_evaluate(
        gb_model, "GradientBoosting", X_train, X_test, y_train, y_test, label_encoder
    )

    xgb_model, xgb_acc = train_and_evaluate(
        xgb_model, "XGBoost", X_train, X_test, y_train, y_test, label_encoder
    )

    RF_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_model, RF_MODEL_PATH)
    joblib.dump(gb_model, GB_MODEL_PATH)
    joblib.dump(xgb_model, XGB_MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)

    model_scores = {
        "RandomForest": (rf_model, rf_acc),
        "GradientBoosting": (gb_model, gb_acc),
        "XGBoost": (xgb_model, xgb_acc),
    }

    best_name, (best_model, best_acc) = max(model_scores.items(), key=lambda item: item[1][1])

    joblib.dump(best_model, BEST_MODEL_PATH)

    print(f"\nBest model selected: {best_name} ({best_acc:.4f})")
    print(f"Saved best stress model to {BEST_MODEL_PATH}")
    print(f"Saved RandomForest model to {RF_MODEL_PATH}")
    print(f"Saved GradientBoosting model to {GB_MODEL_PATH}")
    print(f"Saved XGBoost model to {XGB_MODEL_PATH}")
    print(f"Saved stress encoder to {ENCODER_PATH}")


if __name__ == "__main__":
    main()