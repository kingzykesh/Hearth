import os
import tempfile
import numpy as np
import librosa
from pydub import AudioSegment
import imageio_ffmpeg


FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# Explicitly point pydub to ffmpeg/ffprobe
AudioSegment.converter = FFMPEG_EXE

# Try to derive ffprobe path from ffmpeg install
ffprobe_candidate = FFMPEG_EXE.replace("ffmpeg.exe", "ffprobe.exe")
if os.path.exists(ffprobe_candidate):
    AudioSegment.ffprobe = ffprobe_candidate


def load_and_preprocess_audio(file_bytes: bytes, original_filename: str, target_sr: int = 16000):
    suffix = os.path.splitext(original_filename)[1].lower() or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as input_file:
        input_file.write(file_bytes)
        input_path = input_file.name

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as output_file:
        output_path = output_file.name

    try:
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format="wav")

        y, sr = librosa.load(output_path, sr=target_sr, mono=True)

        if y.size == 0:
            raise ValueError("Audio data is empty after loading.")

        y_trimmed, _ = librosa.effects.trim(y, top_db=20)

        if y_trimmed.size == 0:
            y_trimmed = y

        max_val = np.max(np.abs(y_trimmed))
        if max_val > 0:
            y_trimmed = y_trimmed / max_val

        return y_trimmed, target_sr

    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)