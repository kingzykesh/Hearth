from datasets.loaders.tess_loader import TESSLoader

df = TESSLoader().load_metadata()

print(df.head())
print("\nTOTAL FILES:", len(df))
print("\nLABEL COUNTS:")
print(df["label"].value_counts())