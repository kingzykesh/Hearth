"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AudioLines,
  BrainCircuit,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Upload,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type RecordingState = "idle" | "recording" | "recorded" | "uploading";

const CHECKIN_PROMPT = "How are you feeling today?";

export default function NewScreeningPage() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [uploadedSample, setUploadedSample] = useState<any | null>(null);
  const [userNote, setUserNote] = useState("");

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

  const prediction = uploadedSample?.prediction;

  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [seconds]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
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

    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setAudioUrl("");
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
        if (event.data.size > 0) chunksRef.current.push(event.data);
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
      formData.append("audio", audioBlob, "hearth-checkin.webm");
      formData.append("duration_seconds", String(seconds));
      formData.append("checkin_prompt", CHECKIN_PROMPT);
      formData.append("user_note", userNote.trim());

      const response = await api.post("/api/voice-samples", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedSample(response.data.data ?? null);
      toast.success("Hearth AI Coach has reviewed your check-in.");
      setRecordingState("recorded");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to upload audio.");
      setRecordingState("recorded");
    }
  };

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-7 shadow-2xl">
        <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
            <Sparkles size={14} />
            Hearth AI Check-in
          </div>

          <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl">
            Talk to Hearth. Let your voice become today’s wellness signal.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Answer a short check-in, record your voice, and receive an AI Coach
            summary powered by your vocal biomarkers, Hearth Score, and self-report context.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <BrainCircuit size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">
                  Today’s prompt
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {CHECKIN_PROMPT}
                </h3>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  maxLength={1000}
                  placeholder="Optional: tell Hearth briefly how your day has been, how you slept, or what may be stressing you..."
                  className="mt-5 min-h-[130px] w-full resize-none rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-400/40 focus:bg-black/30"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-white/45">
                  <span>This context helps the AI Coach respond better.</span>
                  <span>{userNote.length}/1000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <div className="rounded-[28px] border border-dashed border-emerald-400/20 bg-emerald-950/20 p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
                {recordingState === "recording" ? (
                  <AudioLines className="animate-pulse text-emerald-300" size={38} />
                ) : (
                  <Mic className="text-emerald-300" size={38} />
                )}
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">Voice Recorder</h3>
              <p className="mt-2 text-sm text-white/60">
                Recommended duration: 8–10 seconds. Speak naturally and clearly.
              </p>

              <div className="mt-7 text-6xl font-black tracking-tight text-white">
                {formattedTime}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {recordingState !== "recording" && recordingState !== "uploading" && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400"
                  >
                    <Mic size={18} />
                    Start Recording
                  </button>
                )}

                {recordingState === "recording" && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-3 font-bold text-red-200 transition hover:bg-red-500/20"
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
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/[0.06]"
                    >
                      <RotateCcw size={18} />
                      Re-record
                    </button>

                    <button
                      type="button"
                      onClick={uploadRecording}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400"
                    >
                      <Upload size={18} />
                      Analyze with AI Coach
                    </button>
                  </>
                )}

                {recordingState === "uploading" && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white opacity-80"
                  >
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing...
                  </button>
                )}
              </div>
            </div>

            {audioUrl && (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Play size={16} />
                  Audio Preview
                </div>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                </audio>
              </div>
            )}
          </div>

          {uploadedSample && (
            <div className="rounded-[30px] border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-300" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-white">Screening Completed</h3>
                  <p className="text-sm text-emerald-100/70">
                    Hearth has processed your voice and generated an AI Coach response.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <ResultMetric
                  label="Hearth Score"
                  value={prediction?.hearth_score ?? "—"}
                />
                <ResultMetric
                  label="Risk Level"
                  value={prediction?.risk_level ?? "—"}
                />
                <ResultMetric
                  label="Confidence"
                  value={
                    prediction?.confidence_score
                      ? `${prediction.confidence_score}%`
                      : "—"
                  }
                />
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Wand2 size={18} />
                  <h4 className="font-semibold">AI Coach Summary</h4>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">
                  {prediction?.ai_coach_summary ||
                    prediction?.summary ||
                    "AI Coach summary will appear here."}
                </p>
              </div>

              {Array.isArray(prediction?.ai_recommendations) &&
                prediction.ai_recommendations.length > 0 && (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <h4 className="font-semibold text-white">Recommended next steps</h4>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-white/75">
                      {prediction.ai_recommendations.map((item: string, index: number) => (
                        <li key={`${item}-${index}`} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-white/55">
                {prediction?.ai_safety_note ||
                  "This is a wellness screening, not a medical diagnosis."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <SideCard
            icon={<HeartPulse size={22} />}
            title="How Phase C Works"
            items={[
              "Answer the daily wellness check-in.",
              "Record an 8–10 second voice sample.",
              "Hearth analyzes vocal biomarkers and AI model signals.",
              "AI Coach gives supportive, non-diagnostic guidance.",
            ]}
          />

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white">Microphone Status</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {permissionGranted === null
                ? "Permission not requested yet."
                : permissionGranted
                ? "Microphone access granted."
                : "Microphone access denied."}
            </p>
          </div>

          <SideCard
            icon={<Activity size={22} />}
            title="Recording Guide"
            items={[
              "Use a quiet environment.",
              "Speak naturally, not forcefully.",
              "Avoid fan noise or background conversations.",
              "Share a short note for better coaching context.",
            ]}
          />

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white">Current Status</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {recordingState === "idle" && "Waiting for your check-in recording."}
              {recordingState === "recording" && "Recording in progress."}
              {recordingState === "recorded" && "Ready for AI Coach analysis."}
              {recordingState === "uploading" && "Analyzing voice and generating coach feedback."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SideCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <ul className="mt-5 space-y-3 text-sm leading-7 text-white/70">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}