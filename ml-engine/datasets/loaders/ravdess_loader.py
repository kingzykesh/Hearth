from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class RAVDESSLoader(BaseDatasetLoader):
    def __init__(self, dataset_root="datasets/raw/stress/ravdess"):
        super().__init__(dataset_root)
    """
    Example filename:
    03-01-05-01-01-01-01.wav

    Third segment = emotion code
    """

    EMOTION_MAP = {
        "01": "low",       # neutral
        "02": "low",       # calm
        "03": "low",       # happy
        "04": "moderate",  # sad
        "05": "high",      # angry
        "06": "high",      # fearful
        "07": "moderate",  # disgust
        "08": "moderate",  # surprised
    }

    def load_metadata(self) -> pd.DataFrame:
        rows = []

        for file_path in self.dataset_root.rglob("*.wav"):
            parts = file_path.stem.split("-")

            if len(parts) < 3:
                continue

            emotion_code = parts[2]
            label = self.EMOTION_MAP.get(emotion_code)

            if not label:
                continue

            rows.append({
                "filepath": str(file_path),
                "label": label,
                "dataset": "ravdess",
            })

        return pd.DataFrame(rows)