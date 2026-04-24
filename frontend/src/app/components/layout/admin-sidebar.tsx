"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Database,
} from "lucide-react";
import { toast } from "sonner"; // Added toast
import api from "@/app/lib/api"; // Added api utility
import { cn } from "@/app/lib/util";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Screenings",
    href: "/admin/screenings",
    icon: Activity,
  },
  {
  label: "Research Dataset",
  href: "/admin/research",
  icon: Database,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  // Consistent logout logic from DashboardSidebar
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      toast.success("Logged out successfully.");
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed.");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-xl backdrop-blur">
      <div className="mb-6 px-2 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium">
          <Shield size={16} />
          Hearth Admin
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                  : "hover:bg-[var(--muted)]"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button matching User Dashboard design */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition hover:bg-[var(--muted)]"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}