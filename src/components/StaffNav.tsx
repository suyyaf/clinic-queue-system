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
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="font-semibold text-gray-900 whitespace-nowrap text-sm">
            Clinic Queue
          </span>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === l.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.short}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500 hidden sm:block">{userName}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
