"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  History,
  LayoutDashboard,
  LogOut,
  User,
  AudioLines,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";
import { cn } from "@/app/lib/util";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "New Screening",
    href: "/dashboard/new-screening",
    icon: Activity,
    disabled: true, // Mark this for maintenance
  },
  {
    label: "Hearth Check",
    href: "/dashboard/screening",
    icon: AudioLines,
  },
  {
    label: "Wellbeing Check",
    href: "/dashboard/screen",
    icon: Waves,
  },
  {
    label: "History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      toast.success("Logged out successfully.");
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed.");
    }
  };

  const handleMaintenanceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error("System down for maintenance", {
      description: "This feature is currently unavailable.",
    });
  };

  return (
    <aside className="flex h-full w-full flex-col rounded-[28px] border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-xl backdrop-blur">
      <div className="mb-6 px-2 pt-2">
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-medium">
          Hearth Dashboard
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const commonStyles = cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition w-full",
            isActive
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
              : "hover:bg-[var(--muted)] text-[var(--foreground)]",
            item.disabled && "opacity-70 cursor-not-allowed" // Visual hint it's disabled
          );

          if (item.disabled) {
            return (
              <button
                key={item.href}
                onClick={handleMaintenanceClick}
                className={commonStyles}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={commonStyles}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

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