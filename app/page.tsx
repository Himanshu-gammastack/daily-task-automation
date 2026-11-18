
"use client";

import { useEffect, useState } from "react";

import TodoHeader from "@/components/tasks/TaskHeader";
import AddTaskForm from "@/components/tasks/AddTaskForm";
import PendingTasks from "@/components/tasks/PendingTasks";
import CompletedTasks from "@/components/tasks/CompletedTasks";

import {
  Task,
  CompletedTask,
  TaskHistory,
} from "@/types/task";

export default function Todo() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [todayHistory, setTodayHistory] =
    useState<TaskHistory | null>(null);

  const [newTask, setNewTask] = useState("");
  const [inTime, setInTime] = useState("");
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(false);

  const todayISO = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });

  const completedToday: CompletedTask[] =
    todayHistory?.taskList || [];

  // Fetch tasks
  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");

    if (!res.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const data = await res.json();

    setActiveTasks(data.activeTasks || []);

     if (data.today) {
      setTodayHistory(data.today);
    } else {
      const history = data.tasksHistory || [];

      const todayData = history.find(
        (h: TaskHistory) =>
          new Date(h.date).toLocaleDateString("en-US", {
            timeZone: "Asia/Kolkata",
          }) === todayISO
      );

      setTodayHistory(todayData || null);
    }
  };

  useEffect(() => {
    fetchTasks().catch(console.error);
  }, []);

  // Add task
  const addTask = async () => {
    if (!newTask.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskTitle: newTask,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add task");
      }

      setNewTask("");
      await fetchTasks();
    } catch (error) {
      alert("Could not add task");
    } finally {
      setLoading(false);
    }
  };

  // Start day
  const startDay = async () => {
    if (!inTime) {
      return alert("Please enter in-time");
    }

    setLoading(true);
    console.log(inTime)

    try {
      const res = await fetch("/api/startDay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inTime }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not start day");
      }

      await fetchTasks();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // End day
  const endDay = async () => {
    if (!confirm("Are you sure you want to end your day?")) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tasks/end-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: todayISO,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not end day");
      }

      await fetchTasks();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };


  // Edit task
  const editTask = async (taskId: string, taskTitle: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      await fetchTasks();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update task");
    }
  };

    // Delete task
    const deleteTask = async (taskId: string) => {
      if (!confirm("Are you sure you want to delete this task?")) return;

      try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      await fetchTasks();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete task");
    }
  };

// Complete task
const completeTask = async (taskId: string) => {
  try {
    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to complete task");
    }

    await fetchTasks();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Could not complete task");
  }
};


  const theme = dark
    ? "bg-neutral-950 text-white"
    : "bg-white text-neutral-900";

  return (
    <main
      className={`min-h-screen transition-colors ${theme}`}
    >
      <div className="max-w-6xl mx-auto p-5 md:p-8">

        {/* HEADER */}
        <TodoHeader
          dark={dark}
          loading={loading}
          today={todayDisplay}
          inTime={todayHistory?.inTime || inTime}
          outTime={todayHistory?.outTime}
          hasStarted={!!todayHistory?.inTime}
          onInTimeChange={setInTime}
          onStartDay={startDay}
          onEndDay={endDay}
          onToggleTheme={() => setDark(!dark)}
        />

        {/* ADD TASK */}
        <AddTaskForm
          value={newTask}
          dark={dark}
          loading={loading}
          onChange={setNewTask}
          onAdd={addTask}
        />

        {/* TASK SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          
          <PendingTasks
            tasks={activeTasks}
            dark={dark}
            onEdit={editTask}
            onDelete={deleteTask}
            onComplete={completeTask}
          />


          <CompletedTasks
            tasks={completedToday}
            dark={dark}
          />

        </div>
      </div>
    </main>
  );
}
