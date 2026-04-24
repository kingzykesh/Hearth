from datasets.loaders.crema_d_loader import CREMADLoader

loader = CREMADLoader("datasets/raw/stress/crema_d")
df = loader.load_metadata()

print(df.head())
print()
print("TOTAL FILES:", len(df))
print()
print(df["label"].value_counts())