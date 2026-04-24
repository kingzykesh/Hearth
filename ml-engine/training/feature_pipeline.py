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


def extract_pitch_features(y, sr):
    try:
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
        )

        voiced_f0 = f0[~np.isnan(f0)] if f0 is not None else np.array([])

        pitch_mean = float(np.mean(voiced_f0)) if voiced_f0.size > 0 else 0.0
        pitch_std = float(np.std(voiced_f0)) if voiced_f0.size > 0 else 0.0
        voiced_ratio = float(np.mean(voiced_flag)) if voiced_flag is not None else 0.0

        if voiced_f0.size > 1:
            x = np.arange(len(voiced_f0))
            pitch_slope = float(np.polyfit(x, voiced_f0, 1)[0])
            jitter_proxy = float(np.mean(np.abs(np.diff(voiced_f0))))
        else:
            pitch_slope = 0.0
            jitter_proxy = 0.0

    except Exception:
        pitch_mean = 0.0
        pitch_std = 0.0
        voiced_ratio = 0.0
        pitch_slope = 0.0
        jitter_proxy = 0.0

    return {
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "voiced_ratio": voiced_ratio,
        "pitch_slope": pitch_slope,
        "jitter_proxy": jitter_proxy,
    }


def extract_tempo_feature(y, sr):
    try:
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo_values = librosa.feature.tempo(onset_envelope=onset_env, sr=sr)
        tempo = float(tempo_values[0]) if len(tempo_values) > 0 else 0.0
    except Exception:
        tempo = 0.0

    return {
        "tempo": tempo,
    }


def extract_pause_and_speaking_features(y, sr):
    try:
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]

        if rms.size == 0:
            return {
                "silence_ratio": 0.0,
                "speaking_rate_proxy": 0.0,
                "shimmer_proxy": 0.0,
                "hnr_proxy": 0.0,
            }

        threshold = max(0.01, float(np.mean(rms) * 0.5))
        silent_frames = rms < threshold
        silence_ratio = float(np.mean(silent_frames))

        onset_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop_length)
        duration_seconds = max(len(y) / sr, 1e-6)
        speaking_rate_proxy = float(len(onset_frames) / duration_seconds)

        voiced_rms = rms[rms >= threshold]
        if voiced_rms.size > 1:
            shimmer_proxy = float(np.mean(np.abs(np.diff(voiced_rms))))
        else:
            shimmer_proxy = 0.0

        harmonic = librosa.effects.harmonic(y)
        noise = y - harmonic
        harmonic_energy = float(np.mean(harmonic ** 2)) + 1e-8
        noise_energy = float(np.mean(noise ** 2)) + 1e-8
        hnr_proxy = float(10 * np.log10(harmonic_energy / noise_energy))

        return {
            "silence_ratio": silence_ratio,
            "speaking_rate_proxy": speaking_rate_proxy,
            "shimmer_proxy": shimmer_proxy,
            "hnr_proxy": hnr_proxy,
        }

    except Exception:
        return {
            "silence_ratio": 0.0,
            "speaking_rate_proxy": 0.0,
            "shimmer_proxy": 0.0,
            "hnr_proxy": 0.0,
        }


def extract_features(y, sr: int):
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta2 = librosa.feature.delta(mfcc, order=2)

    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)

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

    features.update(extract_pitch_features(y, sr))
    features.update(extract_tempo_feature(y, sr))
    features.update(extract_pause_and_speaking_features(y, sr))

    return features


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
    "pitch_mean",
    "pitch_std",
    "voiced_ratio",
    "pitch_slope",
    "jitter_proxy",
    "tempo",
    "silence_ratio",
    "speaking_rate_proxy",
    "shimmer_proxy",
    "hnr_proxy",
]