"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Plus, Check } from "lucide-react";

interface Task {
  _id: string;
  taskTitle: string;
}

interface CompletedTask {
  _id: string;
  taskTitle: string;
  endTime: string;
  timeTaken: number;
}

interface TaskHistory {
  _id: string;
  date: string;
  inTime: string;
  outTime: string;
  taskList: CompletedTask[];
}

export default function Todo() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [newTask, setNewTask] = useState("");
  const [inTime, setInTime] = useState("");
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  const todayHistory = history.find(
    (h) => new Date(h.date).toLocaleDateString("en-CA") === today
  );

  const completedToday = todayHistory?.taskList || [];

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();

    setActiveTasks(data.activeTasks || []);
    setHistory(data.tasksHistory || []);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: newTask }),
      });

      if (!res.ok) throw new Error("Failed to add task");

      setNewTask("");
      await fetchTasks();
    } catch (error) {
      alert("Could not add task");
    } finally {
      setLoading(false);
    }
  };

  const startDay = async () => {
    if (!inTime) return alert("Please enter in-time");

    setLoading(true);

    try {
      const res = await fetch("/api/tasks/start-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Could not start day");
      }

      await fetchTasks();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const endDay = async () => {
    if (!confirm("Are you sure you want to end your day?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/tasks/end-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Could not end day");
      }

      await fetchTasks();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const theme = dark
    ? "bg-neutral-950 text-white border-neutral-800"
    : "bg-white text-neutral-900 border-neutral-200";

  const muted = dark ? "text-neutral-400" : "text-neutral-500";
  const inputStyle = dark
    ? "bg-neutral-900 border-neutral-700 text-white"
    : "bg-white border-neutral-300 text-neutral-900";

  return (
    <main
      className={`min-h-screen transition-colors ${dark ? "bg-neutral-950" : "bg-white"}`}
    >
      <div className="max-w-6xl mx-auto p-5 md:p-8">

        {/* TOP BAR */}
        <header className={`flex flex-wrap items-center justify-between gap-4 border-b pb-5 ${dark ? "border-neutral-800" : "border-neutral-200"}`}>

          <div>
            <h1 className= {`text-xl font-semibold ${dark? 'text -white' : "text-black"}`}>My Todo</h1>
            <p className={`text-sm mt-1 ${muted}`}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">

            {!todayHistory ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  className={`border rounded-md px-3 py-2 text-sm ${inputStyle}`}
                />

                <button
                  onClick={startDay}
                  disabled={loading}
                  className={`border rounded-md px-4 py-2 text-sm ${theme}`}
                >
                  Set In-Time
                </button>
              </div>
            ) : (
              <span className={`text-sm ${muted}`}>
                In: {todayHistory.inTime}
                {todayHistory.outTime && ` | Out: ${todayHistory.outTime}`}
              </span>
            )}

            {todayHistory && !todayHistory.outTime && (
              <button
                onClick={endDay}
                disabled={loading}
                className={`border rounded-md px-4 py-2 text-sm ${theme}`}
              >
                End Day
              </button>
            )}

            <button
              onClick={() => setDark(!dark)}
              className={`border rounded-md p-2 ${theme}`}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* ADD TASK */}
        <div className="flex gap-2 my-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className={`flex-1 border rounded-md px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-neutral-400 ${inputStyle}`}
          />

          <button
            onClick={addTask}
            disabled={loading}
            className={`border rounded-md px-4 ${theme}`}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* TWO COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* PENDING */}
          <section>
            <div className={`flex justify-between items-center pb-3 border-b ${dark ? "border-neutral-800" : "border-neutral-200"}`}>
              <h2 className={`font-semibold ${dark? 'text -white' : "text-black"}`}>Pending Tasks</h2>
              <span className={`text-sm ${muted}`}>
                {activeTasks.length}
              </span>
            </div>

            <div>
              {activeTasks.length === 0 ? (
                <p className={`text-sm py-5 ${muted}`}>
                  No pending tasks.
                </p>
              ) : (
                activeTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`py-4 border-b text-sm ${dark ? "border-neutral-800" : "border-neutral-100"}`}
                  >
                    {task.taskTitle}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COMPLETED */}
          <section>
            <div className={`flex justify-between items-center pb-3 border-b ${dark ? "border-neutral-800" : "border-neutral-200"}`}>
              <h2 className={`font-semibold ${dark? 'text -white' : "text-black"}`}>Done Today</h2>
              <span className={`text-sm ${muted}`}>
                {completedToday.length}
              </span>
            </div>

            <div>
              {completedToday.length === 0 ? (
                <p className={`text-sm py-5 ${muted}`}>
                  No completed tasks yet.
                </p>
              ) : (
                completedToday.map((task) => (
                  <div
                    key={task._id}
                    className={`py-4 border-b flex items-center justify-between gap-3 text-sm ${dark ? "border-neutral-800" : "border-neutral-100"}`}
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
        </div>

      </div>
    </main>
  );
}
