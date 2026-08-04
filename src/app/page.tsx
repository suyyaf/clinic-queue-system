"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatQueueNumber, STATUS_LABELS, STATUS_COLORS } from "@/lib/queue";

type Doctor = { id: string; user: { name: string }; specialty: string; roomNumber: string };
type QueueResult = { queueNumber: number; patientName: string } | null;
type LookupResult = {
  queueNumber: number;
  patientName: string;
  status: string;
  doctor: string | null;
  aheadCount: number;
} | null;

type View = "home" | "register" | "lookup" | "registered";

export default function PatientPage() {
  const [view, setView] = useState<View>("home");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<QueueResult>(null);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult>(null);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors || []));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/queue/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, doctorId: selectedDoctor || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(`Already registered — Queue #${formatQueueNumber(data.queueNumber)}`);
        } else {
          toast.error(data.error || "Registration failed");
        }
        return;
      }
      setRegistered(data);
      setView("registered");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/queue/lookup?phone=${encodeURIComponent(lookupPhone)}`);
      const data = await res.json();
      setLookupResult(data.entry);
      setLookupDone(true);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setView("home");
    setName("");
    setPhone("");
    setSelectedDoctor("");
    setRegistered(null);
    setLookupDone(false);
    setLookupResult(null);
  }

  if (view === "registered" && registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-5">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2">Your Queue Number</p>
              <div className="text-8xl font-black text-gray-900 tracking-tight leading-none">
                #{formatQueueNumber(registered.queueNumber)}
              </div>
            </div>
            <div className="border-t pt-4 space-y-1">
              <p className="font-semibold text-gray-900">{registered.patientName}</p>
              <p className="text-sm text-gray-400">Please wait — we'll call your number</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-sm text-indigo-700 font-medium">
              You'll receive an SMS when it's your turn
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { setView("lookup"); setLookupPhone(phone); }}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              Check My Position
            </button>
            <button onClick={reset} className="w-full text-white/60 hover:text-white py-2 text-sm transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center">
        <h1 className="text-3xl font-black text-white tracking-tight">Clinic Queue</h1>
        <p className="text-indigo-200 mt-1 text-sm">Register or check your position</p>
      </div>

      {/* Card area */}
      <div className="flex-1 bg-gray-50 rounded-t-3xl px-5 pt-6 pb-8">
        {view === "home" && (
          <div className="space-y-3 max-w-md mx-auto">
            <button
              onClick={() => setView("register")}
              className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Get a Queue Number</p>
                <p className="text-sm text-gray-400 mt-0.5">Register your name and phone</p>
              </div>
              <span className="ml-auto text-gray-300 text-xl">›</span>
            </button>

            <button
              onClick={() => setView("lookup")}
              className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">Check My Status</p>
                <p className="text-sm text-gray-400 mt-0.5">Enter your phone to view position</p>
              </div>
              <span className="ml-auto text-gray-300 text-xl">›</span>
            </button>

            <div className="text-center pt-6">
              <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Staff Login →
              </a>
            </div>
          </div>
        )}

        {view === "register" && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
              ← Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Register</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-12 rounded-xl text-base"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+60123456789"
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>
              {doctors.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-700">Doctor <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full h-12 border border-input rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Any available doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user.name}{d.specialty ? ` — ${d.specialty}` : ""}
                        {d.roomNumber ? ` (Room ${d.roomNumber})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors mt-2 text-base"
              >
                {loading ? "Registering…" : "Get My Queue Number"}
              </button>
            </form>
          </div>
        )}

        {view === "lookup" && (
          <div className="max-w-md mx-auto">
            <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
              ← Back
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Check Status</h2>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">Phone Number</Label>
                <Input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="+60123456789"
                  className="h-12 rounded-xl text-base"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
              >
                {loading ? "Searching…" : "Check Status"}
              </button>
            </form>

            {lookupDone && (
              <div className="mt-6">
                {lookupResult ? (
                  <div className="bg-white rounded-2xl border p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-5xl font-black text-indigo-600">
                        #{formatQueueNumber(lookupResult.queueNumber)}
                      </div>
                      <Badge className={`${STATUS_COLORS[lookupResult.status]} font-semibold`}>
                        {STATUS_LABELS[lookupResult.status]}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{lookupResult.patientName}</p>
                      {lookupResult.doctor && (
                        <p className="text-sm text-gray-400 mt-0.5">Dr. {lookupResult.doctor}</p>
                      )}
                    </div>
                    {lookupResult.status === "waiting" && (
                      <div className="bg-indigo-50 rounded-xl p-3 text-sm font-semibold text-indigo-700">
                        {lookupResult.aheadCount === 0
                          ? "🎉 You're next!"
                          : `${lookupResult.aheadCount} patient${lookupResult.aheadCount > 1 ? "s" : ""} ahead of you`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border p-6 text-center text-gray-400 shadow-sm">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="font-semibold text-gray-600">No active queue found</p>
                    <p className="text-sm mt-1">for this phone number today</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
