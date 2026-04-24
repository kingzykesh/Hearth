from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class TESSLoader(BaseDatasetLoader):
    def __init__(self, dataset_root="datasets/raw/stress/tess"):
        super().__init__(dataset_root)

    def emotion_to_label(self, emotion: str):
        mapping = {
            "neutral": "low",
            "happy": "low",
            "pleasant_surprise": "moderate",
            "sad": "moderate",
            "disgust": "moderate",
            "angry": "high",
            "fear": "high",
        }
        return mapping.get(emotion.lower())

    def parse_emotion(self, filename: str):
        """
        TESS filenames often look like:
        OAF_angry.wav
        YAF_fear.wav
        or similar variants
        """
        stem = Path(filename).stem.lower()

        known_emotions = [
            "neutral",
            "happy",
            "pleasant_surprise",
            "sad",
            "disgust",
            "angry",
            "fear",
        ]

        for emotion in known_emotions:
            if emotion in stem:
                return emotion

        return None

    def load_metadata(self) -> pd.DataFrame:
        rows = []

        for file_path in self.dataset_root.rglob("*.wav"):
            emotion = self.parse_emotion(file_path.name)

            if not emotion:
                continue

            label = self.emotion_to_label(emotion)

            if not label:
                continue

            rows.append({
                "filepath": str(file_path),
                "label": label,
                "dataset": "tess",
            })

        return pd.DataFrame(rows)