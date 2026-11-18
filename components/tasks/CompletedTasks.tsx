
"use client";

import { Check } from "lucide-react";
import { CompletedTask } from "@/types/task";

interface Props {
  tasks: CompletedTask[];
  dark: boolean;
}

export default function CompletedTasks({
  tasks,
  dark,
}: Props) {
  const muted = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <section>
      <div
        className={`flex justify-between items-center pb-3 border-b ${
          dark ? "border-neutral-800" : "border-neutral-200"
        }`}
      >
        <h2 className="font-semibold">Done Today</h2>

        <span className={`text-sm ${muted}`}>
          {tasks.length}
        </span>
      </div>

      <div>
        {tasks.length === 0 ? (
          <p className={`text-sm py-5 ${muted}`}>
            No completed tasks yet.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`py-4 border-b flex items-center justify-between gap-3 text-sm ${
                dark ? "border-neutral-800" : "border-neutral-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Check size={16} className={muted} />
                {task.taskTitle}
              </span>

              <span className={muted}>
                {task.timeTaken} min
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
