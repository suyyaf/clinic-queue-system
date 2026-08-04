"use client";

import { useState, useEffect } from "react";
import { formatQueueNumber } from "@/lib/queue";

interface CalledEntry {
  id: string;
  queueNumber: number;
  patientName: string;
  status: string;
  assignedTo?: { roomNumber: string; user: { name: string } } | null;
}

export default function DisplayPage() {
  const [called, setCalled] = useState<CalledEntry[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/display");
      const data = await res.json();
      setCalled(data.called || []);
      setWaitingCount(data.waitingCount || 0);
    }
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const current = called[0];
  const recent = called.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Queue Display</h1>
          <p className="text-blue-200 text-sm">Please listen for your number</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold">{time}</div>
          <div className="text-blue-200 text-sm">{waitingCount} waiting</div>
        </div>
      </div>

      {/* Now Serving */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-blue-200 text-lg uppercase tracking-widest font-medium mb-4">
            Now Serving
          </p>
          {current ? (
            <div className="space-y-3">
              <div className="text-[8rem] font-black leading-none tabular-nums text-white drop-shadow-lg">
                #{formatQueueNumber(current.queueNumber)}
              </div>
              <p className="text-2xl text-blue-100">{current.patientName}</p>
              {current.assignedTo && (
                <p className="text-blue-300">
                  Dr. {current.assignedTo.user.name}
                  {current.assignedTo.roomNumber && ` · Room ${current.assignedTo.roomNumber}`}
                </p>
              )}
            </div>
          ) : (
            <div className="text-4xl font-bold text-blue-300">—</div>
          )}
        </div>

        {/* Recently called */}
        {recent.length > 0 && (
          <div className="w-full max-w-lg">
            <p className="text-blue-300 text-sm uppercase tracking-wide mb-3 text-center">
              Also Called
            </p>
            <div className="grid grid-cols-2 gap-3">
              {recent.map((e) => (
                <div
                  key={e.id}
                  className="bg-white/10 rounded-xl p-4 text-center"
                >
                  <div className="text-3xl font-bold tabular-nums">
                    #{formatQueueNumber(e.queueNumber)}
                  </div>
                  {e.assignedTo && (
                    <p className="text-blue-200 text-xs mt-1">
                      Dr. {e.assignedTo.user.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-blue-300 text-sm mt-8">
        Please proceed to the consultation room when your number is called.
      </p>
    </div>
  );
}
