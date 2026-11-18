
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { getUser } from "@/utils/auth";

const getUserId = (req: NextRequest) => {
  return getUser(req);
};

// PATCH - Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { taskTitle } = await req.json();

    if (!taskTitle?.trim()) {
      return NextResponse.json(
        { message: "taskTitle is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findOneAndUpdate(
      {
        userId,
        "activeTasks._id": id,
      },
      {
        $set: {
          "activeTasks.$.taskTitle": taskTitle.trim(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await connectDB();

    const task = await Task.findOneAndUpdate(
      {
        userId,
        "activeTasks._id": id,
      },
      {
        $pull: {
          activeTasks: { _id: id },
        },
      },
      { new: true }
    );

    if (!task) {
      return NextResponse.json(
        { message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete task" },
      { status: 500 }
    );
  }
}


// POST - Mark task as complete
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid task ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.findOne({ userId });

    if (!task) {
      return NextResponse.json(
        { message: "Task document not found" },
        { status: 404 }
      );
    }

    const taskIndex = task.activeTasks.findIndex(
      (item) => item._id?.toString() === id
    );

    if (taskIndex === -1) {
      return NextResponse.json(
        { message: "Active task not found" },
        { status: 404 }
      );
    }

    // Get today's date in Indian timezone
    const today = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Get current time in 24-hour format
    const endTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());

    // Find today's history entry
    const todayHistory = task.tasksHistory.find(
      (history) =>
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(history.date)) === today
    );

    if (!todayHistory || !todayHistory.inTime) {
      return NextResponse.json(
        { message: "Please set your in-time first" },
        { status: 400 }
      );
    }

    // Get active task
    const completedTask = task.activeTasks[taskIndex];

    // Calculate estimated time taken
    const getMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const previousTask =
      todayHistory.taskList[todayHistory.taskList.length - 1];

    const startTime = previousTask
      ? previousTask.endTime
      : todayHistory.inTime;

    const timeTaken = Math.max(
      0,
      getMinutes(endTime) - getMinutes(startTime)
    );

    // Remove task from activeTasks
    task.activeTasks.splice(taskIndex, 1);

    // Add task to today's taskList
    todayHistory.taskList.push({
      taskTitle: completedTask.taskTitle,
      endTime,
      timeTaken,
    });

    await task.save();

    return NextResponse.json({
      message: "Task completed successfully",
      completedTask: {
        taskTitle: completedTask.taskTitle,
        endTime,
        timeTaken,
      },
    });

  } catch (error) {
    console.error("Complete task error:", error);

    return NextResponse.json(
      { message: "Failed to complete task" },
      { status: 500 }
    );
  }
}
