"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  reception: "bg-blue-100 text-blue-700",
  doctor: "bg-emerald-100 text-emerald-700",
};

const ROLE_ICON: Record<string, string> = {
  admin: "👑",
  reception: "🖥️",
  doctor: "🩺",
};

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  doctorProfile?: { specialty: string; roomNumber: string } | null;
}

type AuthUser = { id: string; name: string; role: string } | null;

export default function AdminPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "reception" as "admin" | "reception" | "doctor",
    specialty: "",
    roomNumber: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "admin") router.push("/login");
        else setAuthUser(d.user);
      });
  }, [router]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    if (authUser) loadUsers();
  }, [authUser, loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${form.name} created`);
        setShowCreate(false);
        setForm({ name: "", email: "", password: "", role: "reception", specialty: "", roomNumber: "" });
        loadUsers();
      } else {
        toast.error(data.error);
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(u: UserData) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      toast.success(u.active ? "Account deactivated" : "Account activated");
      loadUsers();
    }
  }

  if (!authUser) return null;

  const activeUsers = users.filter((u) => u.active);
  const doctorCount = users.filter((u) => u.role === "doctor" && u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav userName={authUser.name} role={authUser.role} />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-gray-900">{activeUsers.length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Active Staff</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-emerald-500">{doctorCount}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Doctors</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-gray-300">{inactiveCount}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Inactive</div>
          </div>
        </div>

        {/* Staff list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-lg">Staff Accounts</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              + Add Staff
            </button>
          </div>

          {users.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 transition-opacity ${!u.active ? "opacity-40" : ""}`}
            >
              <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-gray-100">
                {ROLE_ICON[u.role] ?? "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                  {!u.active && (
                    <span className="text-xs text-gray-300 font-medium">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">{u.email}</p>
                {u.doctorProfile && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[u.doctorProfile.specialty, u.doctorProfile.roomNumber && `Room ${u.doctorProfile.roomNumber}`]
                      .filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleActive(u)}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  u.active
                    ? "border-red-100 text-red-500 hover:bg-red-50"
                    : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {u.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[
              { href: "/reception", label: "Reception Dashboard" },
              { href: "/display", label: "Display Board" },
              { href: "/", label: "Patient Kiosk" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                {l.label} →
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-gray-900">Add Staff Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} className="rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Role</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="reception">Reception</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === "doctor" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Specialty</Label>
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="General" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Room No.</Label>
                  <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="101" className="rounded-xl" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-colors">
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
