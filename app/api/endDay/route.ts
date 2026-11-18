
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { sendDailyUpdate } from "./controller/sendMail";
import { updateZohoWorksheet } from "./controller/updateSheet";
import { getUser } from "@/utils/auth";

const getUserId = (req: NextRequest) => {
  const userId = getUser(req);

  if (!userId) {
    return null;
  }

  return userId;
};


function parseInTime(date: string, time: string): Date {
  const match = time.trim().match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!match) {
    throw new Error(`Invalid inTime format: ${time}`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) {
    throw new Error("Invalid inTime value");
  }

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return new Date(
    `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`
  );
}

function calculateOutTime(): Date {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return new Date(
    Math.ceil((now + fiveMinutes) / fiveMinutes) * fiveMinutes
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function calculateHours(start: Date, end: Date): number {
  return Math.round(
    ((end.getTime() - start.getTime()) / 3600000) * 100
  ) / 100;
}

async function saveToDb(date: string, userId: string, outTime: Date){
  await Task.updateOne({
    userId,
    "tasksHistory.date": date,
  },
  {
    $set: {
      "tasksHistory.$.outTime": outTime,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    
    // Expected format: YYYY-MM-DD
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userTask = await Task.findOne({ userId }).lean();

    if (!userTask) {
      return NextResponse.json(
        { success: false, message: "User task record not found" },
        { status: 404 }
      );
    }

    // Match the requested calendar date.
    const history = userTask.tasksHistory.find(
      (item) =>
        new Date(item.date).toISOString().slice(0, 10) === date
    );

    if (!history) {
      return NextResponse.json(
        { success: false, message: "No task history found for this date" },
        { status: 404 }
      );
    }

    if (!history.taskList?.length) {
      return NextResponse.json(
        { success: false, message: "No completed tasks found" },
        { status: 400 }
      );
    }

    // 1. Calculate working hours.
    const inTime = parseInTime(date, history.inTime);
    const outTime = calculateOutTime();
    saveToDb(date, userId, outTime)

    if (outTime <= inTime) {
      throw new Error("Checkout time must be after check-in time");
    }

    const totalHours = calculateHours(inTime, outTime);

    // 2. Sort tasks by completion timestamp.
    const completedTasks = [...history.taskList].sort(
      (a, b) =>
        new Date(a.endTime).getTime() -
        new Date(b.endTime).getTime()
    );

    // 3. Calculate assumed task breakdown.
    let previousEndTime = inTime;

    const taskBreakdown = completedTasks.map((task) => {
      const endTime = new Date(task.endTime);

      if (
        endTime <= previousEndTime ||
        endTime > outTime
      ) {
        throw new Error(
          `Invalid completion time for task: ${task.taskTitle}`
        );
      }

      const duration = calculateHours(previousEndTime, endTime);

      const breakdown = {
        taskTitle: task.taskTitle,
        startTime: formatTime(previousEndTime),
        endTime: formatTime(endTime),
        timeTaken: duration,
      };

      previousEndTime = endTime;

      return breakdown;
    });

    // 4. Prepare task descriptions for email.
    const taskDescription = taskBreakdown
      .map((task, index) =>
        `${index + 1}. ${task.taskTitle} (${task.timeTaken} hours)`
      )
      .join("\n");

    const workingBreakdown = taskBreakdown
      .map((task) => String(task.timeTaken))
      .join(" + ");

    // 5. Send daily email.
    const mailResult = await sendDailyUpdate({
      to: process.env.DAILY_UPDATE_TO!,
      inTime: formatTime(inTime),
      outTime: formatTime(outTime),
      tasks: taskDescription,
      date: formatDate(date),
    });

    // 6. Prepare Zoho Sheet row.
    // date + 4 matches your example: 17 -> 21.
    const day = Number(date.split("-")[2]);

    const sheetData = [
      {
        Date: formatDate(date),
        " Hours": String(totalHours),
        Description: taskDescription,
        "working breakdown": workingBreakdown,
        row_index: day + 4,
      },
    ];

    // 7. Update Zoho Sheet.
    const sheetResult = await updateZohoWorksheet({
      data: sheetData,
    });

    return NextResponse.json({
      success: true,
      message: "Daily report generated successfully",
      report: {
        date: formatDate(date),
        inTime: formatTime(inTime),
        outTime: formatTime(outTime),
        totalHours,
        taskBreakdown,
        workingBreakdown,
      },
      mailResult,
      sheetResult,
    });
  } catch (error) {
    console.error("Daily report error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate daily report",
      },
      { status: 500 }
    );
  }
}
