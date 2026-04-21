from pathlib import Path
from training.feature_pipeline import load_audio_file, extract_features

base = Path("datasets/raw/stress/ravdess")
sample_file = next(base.rglob("*.wav"))

print("Testing file:", sample_file)

y, sr = load_audio_file(str(sample_file))
features = extract_features(y, sr)

print(features)