from abc import ABC, abstractmethod
from pathlib import Path
import pandas as pd


class BaseDatasetLoader(ABC):
    def __init__(self, dataset_root: str):
        self.dataset_root = Path(dataset_root)

    @abstractmethod
    def load_metadata(self) -> pd.DataFrame:
        """
        Return a DataFrame with at least:
        - filepath
        - label
        - dataset
        """
        raise NotImplementedError