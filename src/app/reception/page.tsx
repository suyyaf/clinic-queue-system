"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import QueueCard, { QueueEntryData } from "@/components/QueueCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Doctor = { id: string; user: { name: string } };
type AuthUser = { id: string; name: string; role: string } | null;

export default function ReceptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>(null);
  const [entries, setEntries] = useState<QueueEntryData[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState<string>("active");
  const [doctorFilter, setDoctorFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || !["reception", "admin"].includes(d.user.role)) {
          router.push("/login");
        } else {
          setUser(d.user);
        }
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
      toast.success(`Registered — Queue #${String(data.queueNumber).padStart(3, "0")}`);
      loadQueue();
    } else {
      toast.error(data.error);
    }
  }

  const filtered = entries.filter((e) => {
    if (filter === "active") return ["waiting", "called", "in_progress"].includes(e.status);
    if (filter === "done") return ["done", "no_show"].includes(e.status);
    return true;
  });

  const waitingCount = entries.filter((e) => e.status === "waiting").length;
  const calledCount = entries.filter((e) => ["called", "in_progress"].includes(e.status)).length;
  const doneCount = entries.filter((e) => ["done", "no_show"].includes(e.status)).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav userName={user.name} role={user.role} />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-blue-600">{waitingCount}</div>
            <div className="text-xs text-gray-500 mt-1">Waiting</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-yellow-600">{calledCount}</div>
            <div className="text-xs text-gray-500 mt-1">In Progress</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border">
            <div className="text-2xl font-bold text-green-600">{doneCount}</div>
            <div className="text-xs text-gray-500 mt-1">Done Today</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleRegisterWalkIn} size="sm">
            + Walk-in Patient
          </Button>

          {doctors.length > 0 && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm bg-white"
            >
              <option value="">All Doctors</option>
              <option value="unassigned">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
              ))}
            </select>
          )}

          <div className="flex gap-1 ml-auto">
            {["active", "done", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  filter === f ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Queue */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {filter === "active" ? "No active patients right now." : "No entries found."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <QueueCard
                key={entry.id}
                entry={entry}
                role="reception"
                doctors={doctors}
                onUpdate={loadQueue}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
