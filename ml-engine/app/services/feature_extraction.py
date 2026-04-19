import numpy as np
import librosa


def extract_features(y, sr: int):
    """
    Extract lightweight voice/signal features for screening.
    Returns a flat dict of scalar feature values.
    """

    # MFCCs
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta2 = librosa.feature.delta(mfcc, order=2)

    # Spectral features
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)

    # Energy / time-domain features
    rms = librosa.feature.rms(y=y)
    zcr = librosa.feature.zero_crossing_rate(y)

    features = {
        "duration_seconds": round(len(y) / sr, 2),

        "mfcc_mean": float(np.mean(mfcc)),
        "mfcc_std": float(np.std(mfcc)),
        "mfcc_delta_mean": float(np.mean(mfcc_delta)),
        "mfcc_delta_std": float(np.std(mfcc_delta)),
        "mfcc_delta2_mean": float(np.mean(mfcc_delta2)),
        "mfcc_delta2_std": float(np.std(mfcc_delta2)),

        "spectral_centroid_mean": float(np.mean(spectral_centroid)),
        "spectral_centroid_std": float(np.std(spectral_centroid)),
        "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
        "spectral_rolloff_std": float(np.std(spectral_rolloff)),
        "spectral_bandwidth_mean": float(np.mean(spectral_bandwidth)),
        "spectral_bandwidth_std": float(np.std(spectral_bandwidth)),

        "rms_mean": float(np.mean(rms)),
        "rms_std": float(np.std(rms)),
        "zcr_mean": float(np.mean(zcr)),
        "zcr_std": float(np.std(zcr)),
    }

    return features