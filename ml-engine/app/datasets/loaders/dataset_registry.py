from datasets.loaders.ravdess_loader import RAVDESSLoader
from datasets.loaders.crema_d_loader import CREMADLoader
from datasets.loaders.daic_woz_loader import DAICWOZLoader


def get_stress_loaders():
    return [
        RAVDESSLoader("datasets/raw/stress/ravdess"),
        CREMADLoader("datasets/raw/stress/crema_d"),
    ]


def get_depression_loaders():
    return [
        DAICWOZLoader(
            "datasets/raw/depression/daic_woz",
            "datasets/raw/depression/daic_woz/metadata.csv",
        )
    ]