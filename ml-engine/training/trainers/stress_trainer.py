from pathlib import Path
import pandas as pd
from datasets.loaders.dataset_registry import get_stress_loaders
from training.feature_pipeline import load_audio_file, extract_features


CACHE_PATH = Path("datasets/processed/stress_features.csv")


def build_stress_dataframe(force_rebuild: bool = False) -> pd.DataFrame:
    if CACHE_PATH.exists() and not force_rebuild:
        print(f"Loading cached stress features from {CACHE_PATH}")
        return pd.read_csv(CACHE_PATH)

    metadata_frames = []

    for loader in get_stress_loaders():
        df = loader.load_metadata()
        if not df.empty:
            metadata_frames.append(df)

    if not metadata_frames:
        raise ValueError("No stress dataset metadata loaded.")

    metadata = pd.concat(metadata_frames, ignore_index=True)

    rows = []
    total = len(metadata)

    print(f"Building stress feature dataset from {total} files...")

    for index, row in metadata.iterrows():
        try:
            y, sr = load_audio_file(row["filepath"])
            features = extract_features(y, sr)

            features["label"] = row["label"]
            features["dataset"] = row["dataset"]
            features["filepath"] = row["filepath"]

            rows.append(features)

            if (index + 1) % 250 == 0 or (index + 1) == total:
                print(f"Processed {index + 1}/{total} files")
        except Exception as e:
            print(f"Skipping {row['filepath']}: {e}")

    df = pd.DataFrame(rows)

    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CACHE_PATH, index=False)
    print(f"Saved stress feature cache to {CACHE_PATH}")

    return df