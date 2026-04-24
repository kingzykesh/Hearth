from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class CREMADLoader(BaseDatasetLoader):
    def __init__(self, dataset_root="datasets/raw/stress/crema_d"):
        super().__init__(dataset_root)
    """
    CREMA-D filename style:
    1001_DFA_ANG_XX.wav

    Emotion mapping:
    ANG angry
    DIS disgust
    FEA fear
    HAP happy
    NEU neutral
    SAD sad
    """

    EMOTION_MAP = {
        "ANG": "high",
        "FEA": "high",
        "DIS": "moderate",
        "SAD": "moderate",
        "HAP": "low",
        "NEU": "low",
    }

    def load_metadata(self) -> pd.DataFrame:
        rows = []

        for file_path in self.dataset_root.rglob("*.wav"):
            parts = file_path.stem.split("_")
            if len(parts) < 3:
                continue

            emotion_code = parts[2]
            label = self.EMOTION_MAP.get(emotion_code)

            if not label:
                continue

            rows.append({
                "filepath": str(file_path),
                "label": label,
                "dataset": "crema_d",
            })

        return pd.DataFrame(rows)