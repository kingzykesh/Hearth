from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class RAVDESSLoader(BaseDatasetLoader):
    """
    RAVDESS naming sample:
    03-01-05-01-01-01-01.wav

    Emotion mapping:
    01 neutral
    02 calm
    03 happy
    04 sad
    05 angry
    06 fearful
    07 disgust
    08 surprised
    """

    EMOTION_MAP = {
        "01": "low",
        "02": "low",
        "03": "low",
        "04": "moderate",
        "05": "high",
        "06": "high",
        "07": "moderate",
        "08": "moderate",
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