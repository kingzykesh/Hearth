from datasets.loaders.ravdess_loader import RAVDESSLoader
from datasets.loaders.crema_d_loader import CREMADLoader
from datasets.loaders.savee_loader import SAVEELoader
from datasets.loaders.tess_loader import TESSLoader
from datasets.loaders.emodb_loader import EmoDBLoader


def get_stress_loaders():
    return [
        RAVDESSLoader(),
        CREMADLoader(),
        SAVEELoader(),
        TESSLoader(),
        EmoDBLoader(),
    ]


def get_depression_loaders():
    return []