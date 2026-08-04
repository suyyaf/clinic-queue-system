"use client";

import { Badge } from "@/components/ui/badge";
import { formatQueueNumber, STATUS_LABELS, STATUS_COLORS } from "@/lib/queue";
import { toast } from "sonner";

export interface QueueEntryData {
  id: string;
  queueNumber: number;
  patientName: string;
  patientPhone: string;
  status: string;
  assignedTo?: { id: string; user: { name: string }; roomNumber: string } | null;
  notes?: string;
  notifiedAt?: string | null;
  calledAt?: string | null;
}

interface Props {
  entry: QueueEntryData;
  role: "reception" | "doctor" | "admin";
  doctors?: { id: string; user: { name: string } }[];
  onUpdate: () => void;
}

export default function QueueCard({ entry, role, doctors = [], onUpdate }: Props) {
  async function updateStatus(status: string) {
    const res = await fetch(`/api/queue/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Marked as ${STATUS_LABELS[status]}`);
      onUpdate();
    }
  }

  async function resendNotification() {
    const res = await fetch(`/api/queue/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendNotification: true }),
    });
    if (res.ok) {
      toast.success("Notification sent");
      onUpdate();
    }
  }

  async function assignDoctor(doctorId: string) {
    const res = await fetch(`/api/queue/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: doctorId || null }),
    });
    if (res.ok) {
      toast.success("Doctor assigned");
      onUpdate();
    }
  }

  const isActive = ["waiting", "called", "in_progress"].includes(entry.status);
  const isCalled = entry.status === "called" || entry.status === "in_progress";
  const isDone = ["done", "no_show"].includes(entry.status);

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      isCalled ? "border-indigo-300 shadow-md shadow-indigo-100 ring-1 ring-indigo-200" :
      isDone ? "border-gray-100 opacity-60" :
      "border-gray-100 shadow-sm"
    }`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black tabular-nums leading-none ${
              isCalled ? "text-indigo-600" : isDone ? "text-gray-400" : "text-gray-900"
            }`}>
              #{formatQueueNumber(entry.queueNumber)}
            </div>
            <Badge className={`${STATUS_COLORS[entry.status]} font-semibold text-xs`}>
              {STATUS_LABELS[entry.status]}
            </Badge>
          </div>
          {entry.notifiedAt && (
            <span className="text-xs text-gray-300 shrink-0">SMS ✓</span>
          )}
        </div>

        {/* Patient info */}
        <div className="mt-2">
          <p className="font-bold text-gray-900">{entry.patientName}</p>
          <p className="text-sm text-gray-400">{entry.patientPhone}</p>
          {entry.assignedTo && (
            <p className="text-xs text-indigo-500 mt-1 font-medium">
              Dr. {entry.assignedTo.user.name}
              {entry.assignedTo.roomNumber && ` · Room ${entry.assignedTo.roomNumber}`}
            </p>
          )}
        </div>

        {/* Doctor assignment (reception) */}
        {role === "reception" && doctors.length > 0 && isActive && (
          <select
            value={entry.assignedTo?.id || ""}
            onChange={(e) => assignDoctor(e.target.value)}
            className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Unassigned</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
            ))}
          </select>
        )}

        {/* Actions */}
        {isActive && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
            {role === "reception" && entry.status === "waiting" && (
              <button
                onClick={() => updateStatus("called")}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Call
              </button>
            )}
            {role === "reception" && entry.status === "called" && (
              <button
                onClick={() => updateStatus("in_progress")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                In Progress
              </button>
            )}
            {role === "reception" && (
              <>
                <button
                  onClick={() => updateStatus("done")}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => updateStatus("no_show")}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
                >
                  No Show
                </button>
              </>
            )}
            {role === "doctor" && entry.status === "in_progress" && (
              <button
                onClick={() => updateStatus("done")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Mark Done
              </button>
            )}
            {role === "doctor" && entry.status === "waiting" && (
              <button
                onClick={() => updateStatus("no_show")}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
              >
                No Show
              </button>
            )}
            {isCalled && (
              <button
                onClick={resendNotification}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-medium rounded-lg transition-colors"
              >
                Resend SMS
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
