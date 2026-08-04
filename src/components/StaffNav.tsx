"use client";

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface Props {
  userName: string;
  role: string;
}

const navLinks: Record<string, { href: string; label: string; short: string }[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", short: "Admin" },
    { href: "/reception", label: "Reception", short: "Queue" },
    { href: "/display", label: "Board", short: "Board" },
  ],
  reception: [
    { href: "/reception", label: "Queue", short: "Queue" },
    { href: "/display", label: "Board", short: "Board" },
  ],
  doctor: [
    { href: "/doctor", label: "My Queue", short: "Queue" },
    { href: "/display", label: "Board", short: "Board" },
  ],
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  reception: "bg-blue-100 text-blue-700",
  doctor: "bg-emerald-100 text-emerald-700",
};

export default function StaffNav({ userName, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
  }

  const links = navLinks[role] || [];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand + nav */}
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 mr-2">
            <span className="text-white text-xs font-black">CQ</span>
          </div>
          <nav className="flex items-center">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  pathname === l.href
                    ? "bg-indigo-600 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.short}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${ROLE_BADGE[role] ?? "bg-gray-100 text-gray-600"}`}>
            {role}
          </span>
          <span className="text-sm text-gray-600 font-medium hidden md:block max-w-32 truncate">{userName}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
