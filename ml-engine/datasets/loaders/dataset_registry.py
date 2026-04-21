from datasets.loaders.ravdess_loader import RAVDESSLoader


def get_stress_loaders():
    return [
        RAVDESSLoader("datasets/raw/stress/ravdess"),
    ]


def get_depression_loaders():
    return []