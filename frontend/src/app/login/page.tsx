"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { getCsrfCookie } from "../lib/api";

type LoginFormData = {
  email: string;
  password: string;
};

type LaravelValidationErrors = Record<string, string[]>;

export default function LoginPage() {
  const [form, setForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LaravelValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

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

      const response = await api.post("/api/auth/login", form);

      toast.success(response.data.message || "Login successful.");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error: any) {
      const response = error?.response;

      if (response?.status === 422) {
        const validationErrors = response.data?.errors || {};
        setErrors(validationErrors);

        const firstError = Object.values(validationErrors)?.[0] as
          | string[]
          | undefined;

        toast.error(firstError?.[0] || response.data?.message || "Login failed.");
      } else {
        toast.error(
          response?.data?.message || "Unable to sign in at the moment."
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
        className="relative z-10 w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-8 shadow-2xl backdrop-blur md:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm">
            Hearth • Welcome back
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">Sign in</h1>
          <p className="mt-3 text-sm opacity-75 md:text-base">
            Continue to your Hearth dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
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
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
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
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password[0]}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="opacity-70">Secure session login enabled</span>
            <button
              type="button"
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-[var(--primary-foreground)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-sm opacity-75">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </motion.div>
    </main>
  );
}