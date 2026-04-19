import io
import numpy as np
import librosa


def load_and_preprocess_audio(file_bytes: bytes, target_sr: int = 16000):
    """
    Load audio from uploaded bytes, convert to mono, resample to target_sr,
    and trim silence.
    """
    audio_stream = io.BytesIO(file_bytes)

    y, sr = librosa.load(audio_stream, sr=target_sr, mono=True)

    if y.size == 0:
        raise ValueError("Audio data is empty after loading.")

    y_trimmed, _ = librosa.effects.trim(y, top_db=20)

    if y_trimmed.size == 0:
        y_trimmed = y

    # Basic amplitude normalization
    max_val = np.max(np.abs(y_trimmed))
    if max_val > 0:
        y_trimmed = y_trimmed / max_val

    return y_trimmed, target_sr