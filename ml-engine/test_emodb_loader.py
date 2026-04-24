from datasets.loaders.emodb_loader import EmoDBLoader

df = EmoDBLoader().load_metadata()

print(df.head())
print("\nTOTAL FILES:", len(df))
print("\nLABEL COUNTS:")
print(df["label"].value_counts())