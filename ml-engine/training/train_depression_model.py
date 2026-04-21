import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder

from training.feature_pipeline import FEATURE_COLUMNS
from training.trainers.depression_trainer import build_depression_dataframe


MODEL_PATH = Path("models/depression/depression_model.pkl")
ENCODER_PATH = Path("models/depression/depression_label_encoder.pkl")
CSV_PATH = Path("datasets/processed/depression_features.csv")


def main():
    df = build_depression_dataframe()

    if df.empty:
        raise ValueError("No valid depression data available for training.")

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CSV_PATH, index=False)

    X = df[FEATURE_COLUMNS]
    y_raw = df["label"]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)

    print("Depression Model Accuracy:", round(acc, 4))
    print(classification_report(y_test, preds, target_names=label_encoder.classes_))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)

    print(f"Saved depression model to {MODEL_PATH}")
    print(f"Saved depression encoder to {ENCODER_PATH}")


if __name__ == "__main__":
    main()