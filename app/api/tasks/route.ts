
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { getUser } from "@/utils/auth";

const getUserId = (req: NextRequest) => {
  const userId = getUser(req);

  if (!userId) {
    return null;
  }

  return userId;
};

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const task = await Task.findOne({ userId });

    if (!task) {
      return NextResponse.json({
        activeTasks: [],
        today: {
          inTime: null,
          outTime: null,
          taskList: [],
        },
      });
    }

    const today = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const todayHistory = task.tasksHistory.find(
      (history) => {
        const historyDate = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(history.date));

        return historyDate === today;
      }
    );

    return NextResponse.json({
      activeTasks: task.activeTasks || [],
      today: {
        date: today,
        inTime: todayHistory?.inTime || null,
        outTime: todayHistory?.outTime || null,
        taskList: todayHistory?.taskList || [],
      },
    });

  } catch (error) {
    console.error("Fetch tasks error:", error);

    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Add a new task
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskTitle } = await req.json();

    if (!taskTitle?.trim()) {
      return NextResponse.json(
        { message: "taskTitle is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findOneAndUpdate(
      { userId },
      {
        $push: {
          activeTasks: { taskTitle: taskTitle.trim() },
        },
        $setOnInsert: { userId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json(
      { message: "Task added successfully", task },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to add task" },
      { status: 500 }
    );
  }
}
