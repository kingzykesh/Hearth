from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class SAVEELoader(BaseDatasetLoader):
    def __init__(self, dataset_root="datasets/raw/stress/savee"):
        super().__init__(dataset_root)

    def emotion_to_label(self, emotion):
        mapping = {
            "n": "low",       # neutral
            "h": "low",       # happy
            "sa": "moderate", # sad
            "d": "moderate",  # disgust
            "su": "moderate", # surprise
            "a": "high",      # angry
            "f": "high",      # fear
        }

        return mapping.get(emotion, "low")

    def parse_emotion(self, filename):
        """
        Examples:
        DC_a01.wav  -> a
        JK_sa02.wav -> sa
        """
        stem = Path(filename).stem
        parts = stem.split("_")

        if len(parts) < 2:
            return None

        return parts[1]

    def load_metadata(self) -> pd.DataFrame:
        rows = []

        for file_path in self.dataset_root.rglob("*.wav"):
            emotion = self.parse_emotion(file_path.name)

            if not emotion:
                continue

            label = self.emotion_to_label(emotion)

            rows.append({
                "filepath": str(file_path),
                "label": label,
                "dataset": "savee",
            })

        return pd.DataFrame(rows)