"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          toast.error(`Already registered today — Queue #${formatQueueNumber(data.queueNumber)}`);
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

  if (view === "registered" && registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4">
            <div className="text-6xl font-bold text-blue-600 tracking-wider">
              #{formatQueueNumber(registered.queueNumber)}
            </div>
            <p className="text-xl text-gray-700">Your Queue Number</p>
            <p className="text-gray-500">Hi <strong>{registered.patientName}</strong>, please wait for your number to be called.</p>
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              You&apos;ll receive an SMS when it&apos;s your turn.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => { setView("lookup"); setLookupPhone(phone); }}>
              Check My Status
            </Button>
            <Button variant="ghost" onClick={() => { setView("home"); setName(""); setPhone(""); setSelectedDoctor(""); setRegistered(null); }}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center space-y-1 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">Clinic Queue</h1>
          <p className="text-gray-500 text-sm">Register or check your queue status</p>
        </div>

        {view === "home" && (
          <div className="grid gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView("register")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  🏥
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Get a Queue Number</p>
                  <p className="text-sm text-gray-500">Register your name and phone</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView("lookup")}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Check My Status</p>
                  <p className="text-sm text-gray-500">Enter your phone to view position</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pt-2">
              <a href="/login" className="text-sm text-gray-400 hover:text-gray-600">Staff Login</a>
            </div>
          </div>
        )}

        {view === "register" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button onClick={() => setView("home")} className="text-gray-400 hover:text-gray-600 text-sm font-normal">← Back</button>
                <span>Register</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+60123456789"
                    required
                  />
                </div>
                {doctors.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor (optional)</Label>
                    <select
                      id="doctor"
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white"
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering…" : "Get Queue Number"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === "lookup" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button onClick={() => { setView("home"); setLookupDone(false); setLookupResult(null); }} className="text-gray-400 hover:text-gray-600 text-sm font-normal">← Back</button>
                <span>Check Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLookup} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="lookup-phone">Phone Number</Label>
                  <Input
                    id="lookup-phone"
                    type="tel"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    placeholder="+60123456789"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Searching…" : "Check Status"}
                </Button>
              </form>

              {lookupDone && (
                <div className="mt-4">
                  {lookupResult ? (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-blue-600">
                          #{formatQueueNumber(lookupResult.queueNumber)}
                        </span>
                        <Badge className={STATUS_COLORS[lookupResult.status]}>
                          {STATUS_LABELS[lookupResult.status]}
                        </Badge>
                      </div>
                      <p className="text-gray-700 font-medium">{lookupResult.patientName}</p>
                      {lookupResult.doctor && (
                        <p className="text-sm text-gray-500">Doctor: Dr. {lookupResult.doctor}</p>
                      )}
                      {lookupResult.status === "waiting" && (
                        <p className="text-sm text-blue-600">
                          {lookupResult.aheadCount === 0
                            ? "You are next!"
                            : `${lookupResult.aheadCount} patient${lookupResult.aheadCount > 1 ? "s" : ""} ahead of you`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No active queue found for this number today.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
