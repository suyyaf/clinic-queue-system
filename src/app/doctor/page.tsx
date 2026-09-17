"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import QueueCard, { QueueEntryData } from "@/components/QueueCard";
import { formatQueueNumber } from "@/lib/queue";
import { toast } from "sonner";

type AuthUser = { id: string; name: string; role: string; doctorProfileId?: string } | null;

export default function DoctorPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>(null);
  const [entries, setEntries] = useState<QueueEntryData[]>([]);
  const [calling, setCalling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "doctor") router.push("/login");
        else setUser(d.user);
      });
  }, [router]);

  const loadQueue = useCallback(async () => {
    const res = await fetch("/api/queue/list");
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const initial = setTimeout(loadQueue, 0);
    const interval = setInterval(loadQueue, 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [user, loadQueue]);

  async function callNextPatient() {
    setCalling(true);
    try {
      const res = await fetch("/api/queue/next", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.entry) {
          toast.success(`Calling #${formatQueueNumber(data.entry.queueNumber)} — ${data.entry.patientName}`);
          loadQueue();
        } else {
          toast.info(data.message || "No more patients in queue");
        }
      }
    } finally {
      setCalling(false);
    }
  }

  const waiting = entries.filter((e) => e.status === "waiting");
  const active = entries.filter((e) => ["called", "in_progress"].includes(e.status));
  const done = entries.filter((e) => ["done", "no_show"].includes(e.status));
  const currentPatient = active[0];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav userName={user.name} role={user.role} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Current patient card */}
        <div className={`rounded-2xl p-5 space-y-4 border-2 shadow-sm ${
          currentPatient ? "bg-white border-indigo-200 shadow-indigo-100" : "bg-white border-gray-100"
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-lg">Now Seeing</h2>
            {waiting.length > 0 && (
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                {waiting.length} waiting
              </span>
            )}
          </div>

          {currentPatient ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-xl font-black text-white">#{formatQueueNumber(currentPatient.queueNumber)}</span>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900">{currentPatient.patientName}</p>
                <p className="text-sm text-gray-400">{currentPatient.patientPhone}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-300">
              <p className="text-4xl mb-2">👨‍⚕️</p>
              <p className="text-sm font-medium text-gray-400">No patient currently</p>
            </div>
          )}

          {/* Actions for current patient */}
          {currentPatient && (
            <div className="flex gap-2">
              {currentPatient.status === "called" && (
                <button
                  onClick={async () => {
                    await fetch(`/api/queue/${currentPatient.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "in_progress" }),
                    });
                    loadQueue();
                  }}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm py-2 rounded-xl transition-colors"
                >
                  Start Consultation
                </button>
              )}
              {currentPatient.status === "in_progress" && (
                <button
                  onClick={async () => {
                    await fetch(`/api/queue/${currentPatient.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "done" }),
                    });
                    loadQueue();
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 rounded-xl transition-colors"
                >
                  Mark Done ✓
                </button>
              )}
              <button
                onClick={async () => {
                  await fetch(`/api/queue/${currentPatient.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sendNotification: true }),
                  });
                  toast.success("Reminder sent");
                }}
                className="px-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium text-sm py-2 rounded-xl transition-colors border border-gray-100"
              >
                Resend SMS
              </button>
            </div>
          )}

          {/* Call next button */}
          <button
            onClick={callNextPatient}
            disabled={calling || waiting.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black py-4 rounded-xl transition-colors text-lg"
          >
            {calling ? "Calling…" : waiting.length === 0 ? "Queue Empty" : `Call Next Patient →`}
          </button>
        </div>

        {/* Waiting list */}
        {waiting.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
              Waiting ({waiting.length})
            </h3>
            {waiting.map((e) => (
              <QueueCard key={e.id} entry={e} role="doctor" onUpdate={loadQueue} />
            ))}
          </div>
        )}

        {/* Done today */}
        {done.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
              Completed Today ({done.length})
            </h3>
            {done.map((e) => (
              <QueueCard key={e.id} entry={e} role="doctor" onUpdate={loadQueue} />
            ))}
          </div>
        )}

        {loading && !entries.length && (
          <div className="text-center py-16 text-gray-300 text-sm">Loading…</div>
        )}
      </div>
    </div>
  );
}
