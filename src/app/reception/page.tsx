"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import QueueCard, { QueueEntryData } from "@/components/QueueCard";
import { formatQueueNumber } from "@/lib/queue";
import { toast } from "sonner";

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
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  async function handleRegisterWalkIn() {
    const name = prompt("Patient name:");
    if (!name) return;
    const phone = prompt("Phone number:");
    if (!phone) return;
    const res = await fetch("/api/queue/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Registered — Queue #${formatQueueNumber(data.queueNumber)}`);
      loadQueue();
    } else {
      toast.error(data.error);
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
            onClick={handleRegisterWalkIn}
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
