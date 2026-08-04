"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  reception: "bg-blue-100 text-blue-700",
  doctor: "bg-green-100 text-green-700",
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
        if (!d.user || d.user.role !== "admin") {
          router.push("/login");
        } else {
          setAuthUser(d.user);
        }
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

  const docCount = users.filter((u) => u.role === "doctor" && u.active).length;
  const staffCount = users.filter((u) => u.active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav userName={authUser.name} role={authUser.role} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-gray-900">{staffCount}</div>
            <div className="text-xs text-gray-500 mt-1">Active Staff</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-green-600">{docCount}</div>
            <div className="text-xs text-gray-500 mt-1">Doctors</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-gray-400">{users.filter((u) => !u.active).length}</div>
            <div className="text-xs text-gray-500 mt-1">Inactive</div>
          </div>
        </div>

        {/* Staff list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Staff Accounts</h2>
            <Button size="sm" onClick={() => setShowCreate(true)}>+ Add Staff</Button>
          </div>

          {users.map((u) => (
            <div key={u.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 ${!u.active ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <Badge className={`${ROLE_COLORS[u.role]} text-xs capitalize`}>{u.role}</Badge>
                  {!u.active && <Badge variant="outline" className="text-xs text-gray-400">Inactive</Badge>}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                {u.doctorProfile && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.doctorProfile.specialty && `${u.doctorProfile.specialty} · `}
                    {u.doctorProfile.roomNumber && `Room ${u.doctorProfile.roomNumber}`}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleActive(u)}
                className={u.active ? "text-red-500 hover:text-red-700" : "text-green-600"}
              >
                {u.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border p-4 space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <a href="/reception" className="text-sm text-blue-600 hover:underline">Reception Dashboard</a>
            <span className="text-gray-300">·</span>
            <a href="/display" className="text-sm text-blue-600 hover:underline">Display Board</a>
            <span className="text-gray-300">·</span>
            <a href="/" className="text-sm text-blue-600 hover:underline">Patient Kiosk</a>
          </div>
        </div>
      </div>

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add Staff Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "reception" | "doctor" })}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="reception">Reception</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "doctor" && (
                <>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="General" />
                  </div>
                  <div className="space-y-2">
                    <Label>Room No.</Label>
                    <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="101" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create Account"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
