
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { getUser } from "@/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = getUser(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inTime } = await req.json();

    if (
      typeof inTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(inTime)
    ) {
      return NextResponse.json(
        { message: "Invalid inTime. Expected HH:mm." },
        { status: 400 }
      );
    }

    await connectDB();

    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find user's task document
    let task = await Task.findOne({ userId });

    if (!task) {
      task = new Task({
        userId,
        activeTasks: [],
        tasksHistory: [],
      });
    }

    // Find today's history
    const todayHistory = task.tasksHistory.find(
      (history) =>
        history.date.toDateString() === today.toDateString()
    );

    if (todayHistory) {
      todayHistory.inTime = inTime;
    } else {
      task.tasksHistory.push({
        date: today,
        inTime,
        outTime: "",
        taskList: [],
      });
    }

    await task.save();

    return NextResponse.json({
      message: "In-time saved successfully",
      inTime,
    });
  } catch (error) {
    console.error("Set in-time error:", error);

    return NextResponse.json(
      { message: "Failed to save in-time" },
      { status: 500 }
    );
  }
}
