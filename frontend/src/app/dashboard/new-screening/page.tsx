"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Upload, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type RecordingState = "idle" | "recording" | "recorded" | "uploading";

export default function NewScreeningPage() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [uploadedSample, setUploadedSample] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopTracks();
      clearTimer();
    };
  }, [audioUrl]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [seconds]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      mediaStreamRef.current = stream;
      return stream;
    } catch {
      setPermissionGranted(false);
      toast.error("Microphone access was denied.");
      return null;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast.error("Your browser does not support audio recording.");
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }

    setUploadedSample(null);
    setAudioBlob(null);
    chunksRef.current = [];
    setSeconds(0);

    const stream = await requestMicPermission();
    if (!stream) return;

    try {
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);
        setRecordingState("recorded");
        clearTimer();
        stopTracks();
      };

      recorder.start();
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 9) {
            stopRecording();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success("Recording started.");
    } catch {
      toast.error("Unable to start recording.");
      stopTracks();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("recorded");
      clearTimer();
      toast.success("Recording stopped.");
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setAudioBlob(null);
    setSeconds(0);
    setRecordingState("idle");
    setUploadedSample(null);
    chunksRef.current = [];
    clearTimer();
    stopTracks();
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      toast.error("Please record audio first.");
      return;
    }

    try {
      setRecordingState("uploading");

      const formData = new FormData();
      formData.append("audio", audioBlob, "screening.webm");
      formData.append("duration_seconds", String(seconds));

      const response = await api.post("/api/voice-samples", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedSample(response.data.data ?? null);
      toast.success(response.data.message || "Audio uploaded successfully.");
      setRecordingState("recorded");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to upload audio at the moment."
      );
      setRecordingState("recorded");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">New Screening</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 opacity-75">
          Record a short voice sample of about 8–10 seconds. Once submitted,
          Hearth will store the audio and prepare it for feature extraction and
          screening.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/15">
                <Mic className="text-[var(--primary)]" size={32} />
              </div>

              <h3 className="mt-5 text-xl font-semibold">Voice Recorder</h3>
              <p className="mt-2 text-sm opacity-70">
                Recommended duration: 8 to 10 seconds
              </p>

              <div className="mt-6 text-4xl font-bold tracking-wide">
                {formattedTime}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {recordingState !== "recording" && recordingState !== "uploading" && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.01]"
                  >
                    <Mic size={18} />
                    Start Recording
                  </button>
                )}

                {recordingState === "recording" && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-5 py-3 font-semibold transition hover:bg-[var(--muted)]"
                  >
                    <Square size={18} />
                    Stop Recording
                  </button>
                )}

                {recordingState === "recorded" && (
                  <>
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-5 py-3 font-semibold transition hover:bg-[var(--muted)]"
                    >
                      <RotateCcw size={18} />
                      Re-record
                    </button>

                    <button
                      type="button"
                      onClick={uploadRecording}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.01]"
                    >
                      <Upload size={18} />
                      Upload Audio
                    </button>
                  </>
                )}

                {recordingState === "uploading" && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--primary-foreground)] opacity-80"
                  >
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </button>
                )}
              </div>
            </div>

            {audioUrl && (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Play size={16} />
                  Audio Preview
                </div>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {uploadedSample && (
              <div className="rounded-[24px] border border-green-500/30 bg-green-500/10 p-5">
                <h4 className="text-sm font-semibold">Upload Saved</h4>
                <div className="mt-3 space-y-2 text-sm opacity-80">
                  <p>
                    <span className="font-medium">File:</span>{" "}
                    {uploadedSample.original_filename}
                  </p>
                  <p>
                    <span className="font-medium">Stored As:</span>{" "}
                    {uploadedSample.stored_filename}
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span>{" "}
                    {uploadedSample.duration_seconds ?? "—"} seconds
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {uploadedSample.processing_status}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Microphone Status</h3>
            <p className="mt-3 text-sm opacity-75">
              {permissionGranted === null
                ? "Permission not requested yet."
                : permissionGranted
                ? "Microphone access granted."
                : "Microphone access denied."}
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Recording Guide</h3>
            <ul className="mt-3 space-y-3 text-sm opacity-75">
              <li>Speak clearly in a quiet environment.</li>
              <li>Keep your voice steady for 8–10 seconds.</li>
              <li>Avoid background conversations or fan noise.</li>
              <li>Preview before upload if needed.</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Upload Status</h3>
            <p className="mt-3 text-sm opacity-75">
              {recordingState === "idle" && "Waiting for recording."}
              {recordingState === "recording" && "Recording in progress."}
              {recordingState === "recorded" && "Ready for upload."}
              {recordingState === "uploading" && "Uploading to server."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}