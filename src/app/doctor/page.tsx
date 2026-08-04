"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/StaffNav";
import QueueCard, { QueueEntryData } from "@/components/QueueCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        if (!d.user || d.user.role !== "doctor") {
          router.push("/login");
        } else {
          setUser(d.user);
        }
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
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Current patient */}
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Current Patient</h2>
            <Badge variant="outline" className="text-xs">{waiting.length} waiting</Badge>
          </div>

          {currentPatient ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-blue-600">
                  #{formatQueueNumber(currentPatient.queueNumber)}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{currentPatient.patientName}</p>
                  <p className="text-sm text-gray-500">{currentPatient.patientPhone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <QueueCard
                  entry={currentPatient}
                  role="doctor"
                  onUpdate={loadQueue}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No patient currently being seen</p>
          )}

          <Button
            onClick={callNextPatient}
            disabled={calling || waiting.length === 0}
            className="w-full"
            size="lg"
          >
            {calling ? "Calling…" : waiting.length === 0 ? "Queue Empty" : "Call Next Patient"}
          </Button>
        </div>

        {/* Waiting queue */}
        {waiting.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Waiting ({waiting.length})
            </h3>
            {waiting.map((e) => (
              <QueueCard key={e.id} entry={e} role="doctor" onUpdate={loadQueue} />
            ))}
          </div>
        )}

        {/* Done today */}
        {done.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">
              Completed Today ({done.length})
            </h3>
            {done.map((e) => (
              <QueueCard key={e.id} entry={e} role="doctor" onUpdate={loadQueue} />
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        )}
      </div>
    </div>
  );
}
