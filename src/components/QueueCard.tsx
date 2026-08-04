"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 transition-all ${entry.status === "called" ? "border-yellow-300 shadow-md" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600 tabular-nums">
            #{formatQueueNumber(entry.queueNumber)}
          </span>
          <Badge className={`${STATUS_COLORS[entry.status]} text-xs`}>
            {STATUS_LABELS[entry.status]}
          </Badge>
        </div>
        {entry.notifiedAt && (
          <span className="text-xs text-gray-400">SMS sent</span>
        )}
      </div>

      <div>
        <p className="font-medium text-gray-900">{entry.patientName}</p>
        <p className="text-sm text-gray-500">{entry.patientPhone}</p>
        {entry.assignedTo && (
          <p className="text-xs text-gray-400 mt-1">
            Dr. {entry.assignedTo.user.name}
            {entry.assignedTo.roomNumber && ` · Room ${entry.assignedTo.roomNumber}`}
          </p>
        )}
      </div>

      {/* Reception: assign doctor */}
      {role === "reception" && doctors.length > 0 && isActive && (
        <select
          value={entry.assignedTo?.id || ""}
          onChange={(e) => assignDoctor(e.target.value)}
          className="w-full border rounded-md px-2 py-1.5 text-xs bg-white"
        >
          <option value="">Unassigned</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
          ))}
        </select>
      )}

      {/* Actions */}
      {isActive && (
        <div className="flex flex-wrap gap-2">
          {role === "reception" && entry.status === "waiting" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("called")}>
              Call
            </Button>
          )}
          {role === "reception" && (
            <>
              {entry.status === "called" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus("in_progress")}>
                  In Progress
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateStatus("no_show")}>
                No Show
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus("done")}>
                Done
              </Button>
            </>
          )}
          {(entry.status === "called" || entry.status === "in_progress") && (
            <Button size="sm" variant="ghost" onClick={resendNotification} className="text-xs">
              Resend SMS
            </Button>
          )}
          {role === "doctor" && entry.status === "in_progress" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("done")}>
              Mark Done
            </Button>
          )}
          {role === "doctor" && entry.status === "waiting" && (
            <Button size="sm" variant="outline" className="text-orange-600" onClick={() => updateStatus("no_show")}>
              No Show
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
