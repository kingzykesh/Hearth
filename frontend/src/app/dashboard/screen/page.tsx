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
  X,
  Database,
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

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [researchAgreed, setResearchAgreed] = useState(false);

  const [survey, setSurvey] = useState({
    stress_level: 5,
    sleep_quality: 5,
    mood_score: 5,
    study_pressure: 5,
    energy_level: 5,
    exam_week: false,
    time_of_day: "",
    notes: "",
  });

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
      setShowSurveyModal(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to upload audio.");
      setRecordingState("recorded");
    }
  };

  const submitResearchSurvey = async () => {
    if (!uploadedSample?.id || !uploadedSample?.prediction?.id) {
      toast.error("Screening data is not ready yet.");
      return;
    }

    if (!researchAgreed) {
      toast.error("Please agree to anonymized research use before submitting.");
      return;
    }

    try {
      setSurveySubmitting(true);

      await api.post("/api/research/consent", {
        agreed: true,
        version: "campus-beta-v1",
      });

      await api.post("/api/research/survey", {
        voice_sample_id: uploadedSample.id,
        prediction_id: uploadedSample.prediction.id,
        stress_level: survey.stress_level,
        sleep_quality: survey.sleep_quality,
        mood_score: survey.mood_score,
        study_pressure: survey.study_pressure,
        energy_level: survey.energy_level,
        exam_week: survey.exam_week,
        time_of_day: survey.time_of_day || null,
        notes: survey.notes || null,
      });

      toast.success("Thank you. Your anonymized survey has been saved.");
      setShowSurveyModal(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to submit survey.");
    } finally {
      setSurveySubmitting(false);
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
            summary powered by vocal biomarkers, Hearth Score, and self-report context.
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
                <ResultMetric label="Hearth Score" value={prediction?.hearth_score ?? "—"} />
                <ResultMetric label="Risk Level" value={prediction?.risk_level ?? "—"} />
                <ResultMetric
                  label="Confidence"
                  value={prediction?.confidence_score ? `${prediction.confidence_score}%` : "—"}
                />
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Wand2 size={18} />
                  <h4 className="font-semibold">AI Coach Summary</h4>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">
                  {prediction?.ai_coach_summary || prediction?.summary || "AI Coach summary will appear here."}
                </p>
              </div>

              {Array.isArray(prediction?.ai_recommendations) && prediction.ai_recommendations.length > 0 && (
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

              <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                <div className="flex items-start gap-3">
                  <Database className="mt-1 text-cyan-200" size={20} />
                  <div>
                    <h4 className="font-semibold text-white">Help Build Hearth Africa Model v1</h4>
                    <p className="mt-2 text-sm leading-7 text-cyan-100/75">
                      Submit a 30-second wellness survey so your anonymized sample can help improve
                      voice AI for African students.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSurveyModal(true)}
                      className="mt-4 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-400"
                    >
                      Complete Research Survey
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-white/55">
                {prediction?.ai_safety_note || "This is a wellness screening, not a medical diagnosis."}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <SideCard
            icon={<HeartPulse size={22} />}
            title="How Phase D.1 Works"
            items={[
              "Complete a voice check-in.",
              "Receive Hearth Score and AI Coach insight.",
              "Optionally consent to anonymized research use.",
              "Submit wellness labels that help train Hearth Africa Model v1.",
            ]}
          />

          <SideCard
            icon={<Activity size={22} />}
            title="Research Data Collected"
            items={[
              "Stress level",
              "Sleep quality",
              "Mood score",
              "Study pressure",
              "Energy level",
              "Exam week context",
            ]}
          />
        </div>
      </div>

      {showSurveyModal && uploadedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#07110d] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                  Hearth Africa Dataset
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  Help improve AI wellness screening for African students
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Your survey responses and anonymized voice sample may help train future Hearth models.
                  Your identity will not be shared in training exports.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSurveyModal(false)}
                className="rounded-2xl border border-white/10 p-2 text-white hover:bg-white/[0.06]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Slider label="Stress Level" value={survey.stress_level} onChange={(v) => setSurvey({ ...survey, stress_level: v })} />
              <Slider label="Sleep Quality" value={survey.sleep_quality} onChange={(v) => setSurvey({ ...survey, sleep_quality: v })} />
              <Slider label="Mood Score" value={survey.mood_score} onChange={(v) => setSurvey({ ...survey, mood_score: v })} />
              <Slider label="Study Pressure" value={survey.study_pressure} onChange={(v) => setSurvey({ ...survey, study_pressure: v })} />
              <Slider label="Energy Level" value={survey.energy_level} onChange={(v) => setSurvey({ ...survey, energy_level: v })} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                <p className="text-sm font-semibold">Time of Day</p>
                <select
                  value={survey.time_of_day}
                  onChange={(e) => setSurvey({ ...survey, time_of_day: e.target.value })}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none"
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
                <input
                  type="checkbox"
                  checked={survey.exam_week}
                  onChange={(e) => setSurvey({ ...survey, exam_week: e.target.checked })}
                />
                <span className="text-sm font-semibold">This is an exam/test week</span>
              </label>
            </div>

            <textarea
              value={survey.notes}
              onChange={(e) => setSurvey({ ...survey, notes: e.target.value })}
              maxLength={1000}
              placeholder="Optional research note..."
              className="mt-5 min-h-[100px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-white/35"
            />

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm leading-7 text-cyan-50/80">
              <input
                type="checkbox"
                checked={researchAgreed}
                onChange={(e) => setResearchAgreed(e.target.checked)}
                className="mt-1"
              />
              <span>
                I agree that my anonymized voice sample and wellness responses may be used to
                improve Hearth AI models and research. I understand this is not medical diagnosis.
              </span>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSurveyModal(false)}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/[0.06]"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={submitResearchSurvey}
                disabled={surveySubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-70"
              >
                {surveySubmitting && <Loader2 size={16} className="animate-spin" />}
                Submit Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-lg font-bold text-cyan-300">{value}/10</p>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full"
      />
    </div>
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