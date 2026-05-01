import sys
import joblib
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

from training.feature_pipeline import FEATURE_COLUMNS
from training.trainers.stress_trainer import build_stress_dataframe


LR_MODEL_PATH = Path("models/stress/stress_model_lr.pkl")
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

    print("\n" + "=" * 70)
    print(f"{model_name} Hold-Out Test Accuracy: {round(acc, 4)}")
    print("=" * 70)
    print(classification_report(y_test, preds, target_names=label_encoder.classes_))

    return model, acc


def run_kfold_validation(models, X, y):
    print("\n" + "=" * 70)
    print("5-FOLD CROSS-VALIDATION RESULTS")
    print("=" * 70)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = {}

    for model_name, model in models.items():
        scores = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="accuracy",
            n_jobs=-1,
        )

        cv_results[model_name] = {
            "scores": scores,
            "mean": scores.mean(),
            "std": scores.std(),
        }

        formatted_scores = [round(score, 4) for score in scores]

        print(f"\n{model_name}")
        print(f"Fold Scores: {formatted_scores}")
        print(f"Mean Accuracy: {scores.mean():.4f}")
        print(f"Std Deviation: {scores.std():.4f}")

    return cv_results


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

    print("\n" + "=" * 70)
    print("STRESS DATASET SUMMARY")
    print("=" * 70)
    print(f"Total Samples: {len(df)}")
    print("\nClass Distribution:")
    print(df["label"].value_counts())

    X = df[FEATURE_COLUMNS]
    y_raw = df["label"]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    lr_model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "classifier",
               LogisticRegression(
    max_iter=3000,
    class_weight="balanced",
    solver="lbfgs",
    random_state=42,
),
            ),
        ]
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

    models = {
        "LogisticRegression": lr_model,
        "RandomForest": rf_model,
        "GradientBoosting": gb_model,
        "XGBoost": xgb_model,
    }

    run_kfold_validation(models, X, y)

    trained_models = {}

    for model_name, model in models.items():
        trained_model, acc = train_and_evaluate(
            model,
            model_name,
            X_train,
            X_test,
            y_train,
            y_test,
            label_encoder,
        )

        trained_models[model_name] = (trained_model, acc)

    LR_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(trained_models["LogisticRegression"][0], LR_MODEL_PATH)
    joblib.dump(trained_models["RandomForest"][0], RF_MODEL_PATH)
    joblib.dump(trained_models["GradientBoosting"][0], GB_MODEL_PATH)
    joblib.dump(trained_models["XGBoost"][0], XGB_MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)

    best_name, (best_model, best_acc) = max(
        trained_models.items(),
        key=lambda item: item[1][1],
    )

    joblib.dump(best_model, BEST_MODEL_PATH)

    print("\n" + "=" * 70)
    print("MODEL SELECTION SUMMARY")
    print("=" * 70)

    for model_name, (_, acc) in trained_models.items():
        print(f"{model_name}: {acc:.4f}")

    print(f"\nBest model selected: {best_name} ({best_acc:.4f})")

    print("\n" + "=" * 70)
    print("SAVED ARTIFACTS")
    print("=" * 70)
    print(f"Saved best stress model to {BEST_MODEL_PATH}")
    print(f"Saved LogisticRegression model to {LR_MODEL_PATH}")
    print(f"Saved RandomForest model to {RF_MODEL_PATH}")
    print(f"Saved GradientBoosting model to {GB_MODEL_PATH}")
    print(f"Saved XGBoost model to {XGB_MODEL_PATH}")
    print(f"Saved stress encoder to {ENCODER_PATH}")


if __name__ == "__main__":
    main()