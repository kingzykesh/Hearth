import pandas as pd
from datasets.loaders.dataset_registry import get_stress_loaders
from training.feature_pipeline import load_audio_file, extract_features


def build_stress_dataframe() -> pd.DataFrame:
    metadata_frames = []

    for loader in get_stress_loaders():
        df = loader.load_metadata()
        if not df.empty:
            metadata_frames.append(df)

    if not metadata_frames:
        raise ValueError("No stress dataset metadata loaded.")

    metadata = pd.concat(metadata_frames, ignore_index=True)

    rows = []
    for _, row in metadata.iterrows():
        try:
            y, sr = load_audio_file(row["filepath"])
            features = extract_features(y, sr)

            features["label"] = row["label"]
            features["dataset"] = row["dataset"]
            features["filepath"] = row["filepath"]

            rows.append(features)
        except Exception as e:
            print(f"Skipping {row['filepath']}: {e}")

    return pd.DataFrame(rows)