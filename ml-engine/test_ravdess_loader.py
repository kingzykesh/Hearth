from datasets.loaders.ravdess_loader import RAVDESSLoader

loader = RAVDESSLoader("datasets/raw/stress/ravdess")

df = loader.load_metadata()

print(df.head())
print()
print("TOTAL FILES:", len(df))
print()
print(df["label"].value_counts())