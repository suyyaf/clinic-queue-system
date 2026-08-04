export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function formatQueueNumber(n: number) {
  return String(n).padStart(3, "0");
}

export const STATUS_LABELS: Record<string, string> = {
  waiting: "Waiting",
  called: "Called",
  in_progress: "In Progress",
  done: "Done",
  no_show: "No Show",
};

export const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-blue-100 text-blue-800",
  called: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-green-100 text-green-800",
  done: "bg-gray-100 text-gray-600",
  no_show: "bg-red-100 text-red-800",
};
