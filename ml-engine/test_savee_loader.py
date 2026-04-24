from datasets.loaders.savee_loader import SAVEELoader

df = SAVEELoader().load_metadata()

print(df.head())
print("\nTOTAL FILES:", len(df))
print("\nLABEL COUNTS:")
print(df["label"].value_counts())