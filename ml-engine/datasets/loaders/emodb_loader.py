from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class EmoDBLoader(BaseDatasetLoader):
    def __init__(self, dataset_root="datasets/raw/stress/emodb"):
        super().__init__(dataset_root)

    def emotion_to_label(self, emotion_code: str):
        mapping = {
            "W": "high",      # anger
            "A": "high",      # fear
            "T": "moderate",  # sadness
            "E": "low",       # disgust / can be adjusted later
            "L": "low",       # boredom
            "F": "low",       # happiness
            "N": "low",       # neutral
        }
        return mapping.get(emotion_code)

    def parse_emotion(self, filename: str):
        """
        EmoDB filenames look like:
        03a01Fa.wav

        Emotion code is typically the 6th character from the end
        before extension, e.g.:
        W = anger
        L = boredom
        E = disgust
        A = fear
        F = happiness
        T = sadness
        N = neutral
        """
        stem = Path(filename).stem

        if len(stem) < 2:
            return None

        # Emotion code is second-to-last character in many EmoDB names
        emotion_code = stem[-2].upper()
        return emotion_code

    def load_metadata(self) -> pd.DataFrame:
        rows = []

        for file_path in self.dataset_root.rglob("*.wav"):
            emotion_code = self.parse_emotion(file_path.name)

            if not emotion_code:
                continue

            label = self.emotion_to_label(emotion_code)

            if not label:
                continue

            rows.append({
                "filepath": str(file_path),
                "label": label,
                "dataset": "emodb",
            })

        return pd.DataFrame(rows)