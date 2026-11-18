
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
