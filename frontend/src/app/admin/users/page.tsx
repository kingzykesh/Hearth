"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/lib/api";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
};

type PaginatedUsers = {
  data: AdminUser[];
  current_page: number;
  last_page: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/users", {
        params: {
          search: query,
        },
      });
      setUsers(response.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setBusyId(id);
      const response = await api.patch(`/api/admin/users/${id}/toggle-status`);
      toast.success(response.data.message || "User status updated.");
      fetchUsers(search);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update user.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setBusyId(id);
      const response = await api.delete(`/api/admin/users/${id}`);
      toast.success(response.data.message || "User deleted successfully.");
      fetchUsers(search);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to delete user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Users</h2>
            <p className="mt-2 text-sm opacity-70">
              Search, deactivate, or delete user accounts.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full max-w-md gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
              />
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-transparent py-3 pl-10 pr-4 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 font-medium text-[var(--primary-foreground)]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] px-5 py-3">
              <Loader2 className="animate-spin" size={18} />
              <span>Loading users...</span>
            </div>
          </div>
        ) : !users?.data?.length ? (
          <div className="py-16 text-center text-sm opacity-70">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Verified</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--border)]/50"
                  >
                    <td className="px-3 py-4">{user.name}</td>
                    <td className="px-3 py-4">{user.email}</td>
                    <td className="px-3 py-4">
                      {user.email_verified_at ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          user.is_active
                            ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                            : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-4">{formatDate(user.created_at)}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => handleToggleStatus(user.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium transition hover:bg-[var(--muted)]"
                        >
                          <Power size={14} />
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => handleDelete(user.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition hover:opacity-90 dark:text-red-400"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}