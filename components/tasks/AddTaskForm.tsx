
"use client";

import { Plus } from "lucide-react";

interface Props {
  value: string;
  dark: boolean;
  loading: boolean;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export default function AddTaskForm({
  value,
  dark,
  loading,
  onChange,
  onAdd,
}: Props) {
  const inputStyle = dark
    ? "bg-neutral-900 border-neutral-700 text-white"
    : "bg-white border-neutral-300 text-neutral-900";

  const theme = dark
    ? "bg-neutral-950 text-white border-neutral-800"
    : "bg-white text-neutral-900 border-neutral-200";

  return (
    <div className="flex gap-2 my-6">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        placeholder="Add a new task..."
        className={`flex-1 border rounded-md px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-neutral-400 ${inputStyle}`}
      />

      <button
        onClick={onAdd}
        disabled={loading || !value.trim()}
        className={`border rounded-md px-4 ${theme}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
