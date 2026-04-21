"use client";

import { useEffect, useState } from "react";
import { Loader2, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";
import AdminSidebar from "../components/layout/admin-sidebar";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles?: { name: string }[];
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/auth/me");
        const currentUser = response.data.user;
        const isAdmin = currentUser?.roles?.some(
          (role: { name: string }) => role.name === "admin"
        );

        if (!isAdmin) {
          toast.error("You are not authorized to access the admin dashboard.");
          window.location.href = "/dashboard";
          return;
        }

        setUser(currentUser);
      } catch {
        toast.error("Please sign in to continue.");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading admin dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 text-[var(--foreground)] md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-6 h-[calc(100vh-48px)]">
            <AdminSidebar />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
            >
              <PanelLeft size={18} />
              <span>Menu</span>
            </button>
          </div>

          <header className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-sm opacity-70">Admin Control Center</p>
            <h1 className="mt-2 text-3xl font-bold">Hearth Admin Dashboard</h1>
            <p className="mt-2 text-sm opacity-70">
              Signed in as {user?.name} ({user?.email})
            </p>
          </header>

          {children}
        </div>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-[var(--background)] p-4">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-xl border border-[var(--border)] px-3 py-2"
              >
                Close
              </button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}
    </main>
  );
}