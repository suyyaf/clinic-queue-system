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
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" }));
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
  const recent = called.slice(1, 4);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-black">CQ</span>
          </div>
          <div>
            <p className="font-black text-white text-lg leading-none">Clinic Queue</p>
            <p className="text-gray-500 text-xs mt-0.5">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-white tabular-nums">{time}</div>
          <div className="text-gray-500 text-xs mt-0.5">{waitingCount} patient{waitingCount !== 1 ? "s" : ""} waiting</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* Main — Now Serving */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
          <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">
            Now Serving
          </p>

          {current ? (
            <div className="text-center space-y-3">
              <div className="text-[12vw] lg:text-[10rem] font-black leading-none tabular-nums text-white">
                #{formatQueueNumber(current.queueNumber)}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-300">{current.patientName.split(" ")[0]}</p>
              {current.assignedTo && (
                <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full text-sm font-semibold">
                  Dr. {current.assignedTo.user.name}
                  {current.assignedTo.roomNumber && ` · Room ${current.assignedTo.roomNumber}`}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-[8rem] font-black text-gray-800 leading-none">—</div>
              <p className="text-gray-600 text-lg mt-2">No patient called yet</p>
            </div>
          )}
        </div>

        {/* Sidebar — Also Called */}
        {recent.length > 0 && (
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-800 px-6 py-6 flex flex-col gap-3">
            <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-1">Also Called</p>
            {recent.map((e) => (
              <div key={e.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="text-3xl font-black tabular-nums text-gray-300">
                  #{formatQueueNumber(e.queueNumber)}
                </div>
                {e.assignedTo && (
                  <p className="text-xs text-gray-600 mt-1">Dr. {e.assignedTo.user.name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-gray-900">
        <p className="text-gray-700 text-xs">Please proceed to the consultation room when your number is called</p>
      </div>
    </div>
  );
}
