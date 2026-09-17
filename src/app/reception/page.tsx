"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import QueueCard, { QueueEntryData } from "@/components/QueueCard";
import { formatQueueNumber } from "@/lib/queue";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Doctor = { id: string; user: { name: string } };
type AuthUser = { id: string; name: string; role: string } | null;

export default function ReceptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>(null);
  const [entries, setEntries] = useState<QueueEntryData[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInLoading, setWalkInLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || !["reception", "admin"].includes(d.user.role)) router.push("/login");
        else setUser(d.user);
      });
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors || []));
  }, [router]);

  const loadQueue = useCallback(async () => {
    if (!user) return;
    const params = new URLSearchParams();
    if (doctorFilter) params.set("doctorId", doctorFilter);
    const res = await fetch(`/api/queue/list?${params}`);
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }, [user, doctorFilter]);

  useEffect(() => {
    const initial = setTimeout(loadQueue, 0);
    const interval = setInterval(loadQueue, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [loadQueue]);

  async function handleRegisterWalkIn(e: React.FormEvent) {
    e.preventDefault();
    setWalkInLoading(true);
    try {
      const res = await fetch("/api/queue/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: walkInName, phone: walkInPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Registered — Queue #${formatQueueNumber(data.queueNumber)}`);
        setShowWalkIn(false);
        setWalkInName("");
        setWalkInPhone("");
        loadQueue();
      } else {
        toast.error(data.error);
      }
    } finally {
      setWalkInLoading(false);
    }
  }

  const waiting = entries.filter((e) => e.status === "waiting");
  const inProgress = entries.filter((e) => ["called", "in_progress"].includes(e.status));
  const done = entries.filter((e) => ["done", "no_show"].includes(e.status));

  const filtered = entries.filter((e) => {
    if (filter === "active") return ["waiting", "called", "in_progress"].includes(e.status);
    if (filter === "done") return ["done", "no_show"].includes(e.status);
    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav userName={user.name} role={user.role} />

      <Dialog open={showWalkIn} onOpenChange={setShowWalkIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Walk-in Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterWalkIn} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="font-semibold">Full Name</Label>
              <Input
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Patient's full name"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Phone Number</Label>
              <Input
                type="tel"
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                placeholder="+60123456789"
                required
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowWalkIn(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={walkInLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {walkInLoading ? "Registering…" : "Register"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-indigo-600">{waiting.length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Waiting</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-amber-500">{inProgress.length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-emerald-500">{done.length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Done</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowWalkIn(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            + Walk-in
          </button>

          {doctors.length > 0 && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Doctors</option>
              <option value="unassigned">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
              ))}
            </select>
          )}

          <div className="flex gap-1 ml-auto bg-gray-100 rounded-xl p-1">
            {(["active", "done", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✓</p>
            <p className="font-bold text-gray-400">
              {filter === "active" ? "No active patients" : "No entries found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <QueueCard key={entry.id} entry={entry} role="reception" doctors={doctors} onUpdate={loadQueue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
