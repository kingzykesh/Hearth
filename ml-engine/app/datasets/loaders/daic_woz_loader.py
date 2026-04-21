from pathlib import Path
import pandas as pd
from datasets.loaders.base_loader import BaseDatasetLoader


class DAICWOZLoader(BaseDatasetLoader):
    """
    Expected CSV columns in metadata file:
    participant_id, audio_path, phq_score

    Label mapping:
    0-4 -> healthy
    5-9 -> mild
    10+ -> elevated
    """

    def __init__(self, dataset_root: str, metadata_csv: str):
        super().__init__(dataset_root)
        self.metadata_csv = Path(metadata_csv)

    @staticmethod
    def map_label(phq_score: int) -> str:
        if phq_score <= 4:
            return "healthy"
        if phq_score <= 9:
            return "mild"
        return "elevated"

    def load_metadata(self) -> pd.DataFrame:
        if not self.metadata_csv.exists():
            raise FileNotFoundError(f"Metadata CSV not found: {self.metadata_csv}")

        df = pd.read_csv(self.metadata_csv)

        required_cols = {"participant_id", "audio_path", "phq_score"}
        missing = required_cols - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns in DAIC-WOZ metadata: {missing}")

        rows = []
        for _, row in df.iterrows():
            audio_file = self.dataset_root / str(row["audio_path"])
            if not audio_file.exists():
                continue

            phq_score = int(row["phq_score"])
            rows.append({
                "filepath": str(audio_file),
                "label": self.map_label(phq_score),
                "dataset": "daic_woz",
                "phq_score": phq_score,
                "participant_id": row["participant_id"],
            })

        return pd.DataFrame(rows)