import os
import tempfile
import numpy as np
import librosa
from pydub import AudioSegment
import imageio_ffmpeg


FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = FFMPEG_EXE

ffprobe_candidate = FFMPEG_EXE.replace("ffmpeg.exe", "ffprobe.exe")
if os.path.exists(ffprobe_candidate):
    AudioSegment.ffprobe = ffprobe_candidate


def load_audio_file(file_path: str, target_sr: int = 16000):
    suffix = os.path.splitext(file_path)[1].lower() or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as output_file:
        output_path = output_file.name

    try:
        audio = AudioSegment.from_file(file_path)
        audio.export(output_path, format="wav")

        y, sr = librosa.load(output_path, sr=target_sr, mono=True)

        if y.size == 0:
            raise ValueError(f"Audio data is empty for {file_path}")

        y_trimmed, _ = librosa.effects.trim(y, top_db=20)
        if y_trimmed.size == 0:
            y_trimmed = y

        max_val = np.max(np.abs(y_trimmed))
        if max_val > 0:
            y_trimmed = y_trimmed / max_val

        return y_trimmed, sr

    finally:
        if os.path.exists(output_path):
            os.remove(output_path)


def extract_features(y, sr: int):
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta2 = librosa.feature.delta(mfcc, order=2)

    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)

    rms = librosa.feature.rms(y=y)
    zcr = librosa.feature.zero_crossing_rate(y)

    return {
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


FEATURE_COLUMNS = [
    "duration_seconds",
    "mfcc_mean",
    "mfcc_std",
    "mfcc_delta_mean",
    "mfcc_delta_std",
    "mfcc_delta2_mean",
    "mfcc_delta2_std",
    "spectral_centroid_mean",
    "spectral_centroid_std",
    "spectral_rolloff_mean",
    "spectral_rolloff_std",
    "spectral_bandwidth_mean",
    "spectral_bandwidth_std",
    "rms_mean",
    "rms_std",
    "zcr_mean",
    "zcr_std",
]