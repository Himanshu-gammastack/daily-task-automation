
"use client";

import { useState } from "react";
import { Check, Pencil, Save, Trash2, X } from "lucide-react";
import { Task } from "@/types/task";

interface Props {
  tasks: Task[];
  dark: boolean;
  onEdit: (taskId: string, taskTitle: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export default function PendingTasks({
  tasks,
  dark,
  onEdit,
  onDelete,
  onComplete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const muted = dark ? "text-neutral-400" : "text-neutral-500";

  const handleEdit = (task: Task) => {
    setEditingId(task._id);
    setEditedTitle(task.taskTitle);
  };

  const handleSave = (taskId: string) => {
    if (!editedTitle.trim()) return;

    onEdit(taskId, editedTitle.trim());
    setEditingId(null);
    setEditedTitle("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedTitle("");
  };

  return (
    <section>
      <div
        className={`flex justify-between items-center pb-3 border-b ${
          dark ? "border-neutral-800" : "border-neutral-200"
        }`}
      >
        <h2 className="font-semibold">Pending Tasks</h2>

        <span className={`text-sm ${muted}`}>
          {tasks.length}
        </span>
      </div>

      <div>
        {tasks.length === 0 ? (
          <p className={`text-sm py-5 ${muted}`}>
            No pending tasks.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`py-4 border-b flex items-center justify-between gap-3 ${
                dark ? "border-neutral-800" : "border-neutral-100"
              }`}
            >
              {editingId === task._id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(task._id);
                      if (e.key === "Escape") handleCancel();
                    }}
                    autoFocus
                    className={`min-w-0 flex-1 border rounded-md px-3 py-2 text-sm outline-none ${
                      dark
                        ? "bg-neutral-900 border-neutral-700 text-white"
                        : "bg-white border-neutral-300 text-neutral-900"
                    }`}
                  />

                  <button
                    onClick={() => handleSave(task._id)}
                    disabled={!editedTitle.trim()}
                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-md disabled:opacity-40"
                    title="Save"
                  >
                    <Save size={17} />
                  </button>

                  <button
                    onClick={handleCancel}
                    className={`p-2 rounded-md ${muted}`}
                    title="Cancel"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm flex-1 min-w-0 break-words">
                    {task.taskTitle}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onComplete(task._id)}
                      className="p-2 text-green-500 hover:bg-green-500/10 rounded-md"
                      title="Mark complete"
                    >
                      <Check size={17} />
                    </button>

                    <button
                      onClick={() => handleEdit(task)}
                      className={`p-2 rounded-md hover:bg-neutral-500/10 ${muted}`}
                      title="Edit task"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => onDelete(task._id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
