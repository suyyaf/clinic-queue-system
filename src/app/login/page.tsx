"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      if (data.role === "admin") router.push("/admin");
      else if (data.role === "doctor") router.push("/doctor");
      else router.push("/reception");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="text-2xl font-black text-white">Staff Login</h1>
          <p className="text-indigo-200 text-sm mt-1">Clinic Queue System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700 text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-11 rounded-xl"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-gray-700 text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-1"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-indigo-200 hover:text-white transition-colors">
            ← Back to patient kiosk
          </Link>
        </div>
      </div>
    </div>
  );
}
