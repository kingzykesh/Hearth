"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { getCsrfCookie } from "../lib/api";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  gender: string;
  age: string;
  consent: boolean;
  terms_accepted: boolean;
};

type LaravelValidationErrors = Record<string, string[]>;

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { label: "Weak", width: "33%" };
  }

  if (score <= 4) {
    return { label: "Medium", width: "66%" };
  }

  return { label: "Strong", width: "100%" };
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    gender: "",
    age: "",
    consent: false,
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<LaravelValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await getCsrfCookie();

      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
      };

      const response = await api.post("/api/auth/register", payload);

      toast.success(response.data.message || "Registration successful.");

      setForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        gender: "",
        age: "",
        consent: false,
        terms_accepted: false,
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error: any) {
      const response = error?.response;

      if (response?.status === 422) {
        const validationErrors = response.data?.errors || {};
        setErrors(validationErrors);

        const firstError = Object.values(validationErrors)?.[0] as
          | string[]
          | undefined;

        toast.error(firstError?.[0] || response.data?.message || "Validation failed.");
      } else {
        toast.error(
          response?.data?.message || "Something went wrong during registration."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-6 py-12 text-[var(--foreground)]">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[-80px] top-10 h-72 w-72 rounded-full bg-[var(--primary)]/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-80px] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-8 shadow-2xl backdrop-blur md:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm">
            Hearth • Create account
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">
            Join Hearth today
          </h1>
          <p className="mt-3 text-sm opacity-75 md:text-base">
            Create your account to begin AI-powered voice screening.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 22"
                min="1"
                max="120"
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--primary)]"
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 pr-12 outline-none transition focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {form.password && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className="text-xs opacity-70">
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-500">{errors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 pr-12 outline-none transition focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirmation((prev) => !prev)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70"
                >
                  {showPasswordConfirmation ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {errors.password_confirmation && (
                <p className="text-sm text-red-500">
                  {errors.password_confirmation[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-green-600"
              />
              <span>
                I consent to the collection and processing of my screening data
                for academic and system evaluation purposes.
              </span>
            </label>
            {errors.consent && (
              <p className="text-sm text-red-500">{errors.consent[0]}</p>
            )}

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="terms_accepted"
                checked={form.terms_accepted}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-green-600"
              />
              <span>
                I have read and accept the terms and understand Hearth provides
                preliminary screening, not medical diagnosis.
              </span>
            </label>
            {errors.terms_accepted && (
              <p className="text-sm text-red-500">
                {errors.terms_accepted[0]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm opacity-75">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </main>
  );
}