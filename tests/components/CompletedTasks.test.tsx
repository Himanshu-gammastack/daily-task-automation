
import { NextRequest } from "next/server";
import {
  PATCH,
  DELETE,
  POST,
} from "@/app/api/tasks/[id]/route";
import { render, screen } from "@testing-library/react";
import { connectDB } from "@/utils/db";
import { getUser } from "@/utils/auth";
import Task from "@/model/Tasks";

jest.mock("@/utils/db", () => ({
  connectDB: jest.fn(),
}));

jest.mock("@/utils/auth", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/model/Tasks", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mockedConnectDB = connectDB as jest.Mock;
const mockedGetUser = getUser as jest.Mock;
const mockedFindOne = Task.findOne as jest.Mock;
const mockedFindOneAndUpdate = Task.findOneAndUpdate as jest.Mock;

const validId = "507f1f77bcf86cd799439011";
const invalidId = "invalid-id";

function createRequest(
  method: string,
  body?: unknown
): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/tasks/${validId}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }
  );
}

function createParams(id = validId) {
  return {
    params: Promise.resolve({ id }),
  };
}

function createTaskDocument(): any {
  return {
    activeTasks: [
      {
        _id: validId,
        taskTitle: "Learn TypeScript",
      },
      {
        _id: "507f1f77bcf86cd799439012",
        taskTitle: "Build API",
      },
    ],
    tasksHistory: [
      {
        date: new Date(),
        inTime: "00:00",
        outTime: "",
        taskList: [],
      },
    ],
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe("/api/tasks/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetUser.mockReturnValue("user123");
    mockedConnectDB.mockResolvedValue(undefined);
  });

  // ---------------- PATCH ----------------

  describe("PATCH - Update task", () => {
    test("returns 401 when user is not authenticated", async () => {
      mockedGetUser.mockReturnValue(null);

      const response = await PATCH(
        createRequest("PATCH", {
          taskTitle: "Updated title",
        }),
        createParams()
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Unauthorized",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("returns 400 when taskTitle is missing", async () => {
      const response = await PATCH(
        createRequest("PATCH", {}),
        createParams()
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "taskTitle is required",
      });
    });

    test("returns 400 when taskTitle is empty", async () => {
      const response = await PATCH(
        createRequest("PATCH", {
          taskTitle: "   ",
        }),
        createParams()
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "taskTitle is required",
      });
    });

    test("updates a task successfully", async () => {
      const updatedTask = {
        activeTasks: [
          {
            _id: validId,
            taskTitle: "Updated title",
          },
        ],
      };

      mockedFindOneAndUpdate.mockResolvedValue(updatedTask);

      const response = await PATCH(
        createRequest("PATCH", {
          taskTitle: "Updated title",
        }),
        createParams()
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: "Task updated successfully",
        task: updatedTask,
      });

      expect(mockedFindOneAndUpdate).toHaveBeenCalledWith(
        {
          userId: "user123",
          "activeTasks._id": validId,
        },
        {
          $set: {
            "activeTasks.$.taskTitle": "Updated title",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    });

    test("trims whitespace from updated task title", async () => {
      mockedFindOneAndUpdate.mockResolvedValue({
        activeTasks: [],
      });

      await PATCH(
        createRequest("PATCH", {
          taskTitle: "  Updated title  ",
        }),
        createParams()
      );

      expect(mockedFindOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        {
          $set: {
            "activeTasks.$.taskTitle": "Updated title",
          },
        },
        expect.anything()
      );
    });

    test("returns 404 when task does not exist", async () => {
      mockedFindOneAndUpdate.mockResolvedValue(null);

      const response = await PATCH(
        createRequest("PATCH", {
          taskTitle: "Updated title",
        }),
        createParams()
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        message: "Task not found",
      });
    });

    test("returns 500 when updating task fails", async () => {
      mockedFindOneAndUpdate.mockRejectedValue(
        new Error("Database update failed")
      );

      const response = await PATCH(
        createRequest("PATCH", {
          taskTitle: "Updated title",
        }),
        createParams()
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to update task",
      });
    });
  });

  // ---------------- DELETE ----------------

  describe("DELETE - Delete task", () => {
    test("returns 401 when user is not authenticated", async () => {
      mockedGetUser.mockReturnValue(null);

      const response = await DELETE(
        createRequest("DELETE"),
        createParams()
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Unauthorized",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("deletes a task successfully", async () => {
      const updatedTask = {
        activeTasks: [
          {
            _id: "507f1f77bcf86cd799439012",
            taskTitle: "Build API",
          },
        ],
      };

      mockedFindOneAndUpdate.mockResolvedValue(updatedTask);

      const response = await DELETE(
        createRequest("DELETE"),
        createParams()
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: "Task deleted successfully",
        task: updatedTask,
      });

      expect(mockedFindOneAndUpdate).toHaveBeenCalledWith(
        {
          userId: "user123",
          "activeTasks._id": validId,
        },
        {
          $pull: {
            activeTasks: {
              _id: validId,
            },
          },
        },
        {
          new: true,
        }
      );
    });

    test("returns 404 when task does not exist", async () => {
      mockedFindOneAndUpdate.mockResolvedValue(null);

      const response = await DELETE(
        createRequest("DELETE"),
        createParams()
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        message: "Task not found",
      });
    });

    test("returns 500 when deleting task fails", async () => {
      mockedFindOneAndUpdate.mockRejectedValue(
        new Error("Database delete failed")
      );

      const response = await DELETE(
        createRequest("DELETE"),
        createParams()
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to delete task",
      });
    });
  });

  // ---------------- POST: COMPLETE TASK ----------------

  describe("POST - Complete task", () => {
    test("returns 401 when user is not authenticated", async () => {
      mockedGetUser.mockReturnValue(null);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Unauthorized",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("returns 400 when task ID is invalid", async () => {
      const response = await POST(
        createRequest("POST"),
        createParams(invalidId)
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Invalid task ID",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("returns 404 when task document does not exist", async () => {
      mockedFindOne.mockResolvedValue(null);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        message: "Task document not found",
      });
    });

    test("returns 404 when active task does not exist", async () => {
      const task = createTaskDocument();
      task.activeTasks = [];

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        message: "Active task not found",
      });
    });

    test("returns 400 when today's in-time has not been set", async () => {
      const task = createTaskDocument();
      task.tasksHistory[0].inTime = "";

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Please set your in-time first",
      });

      expect(task.save).not.toHaveBeenCalled();
    });

    test("returns 400 when today's history does not exist", async () => {
      const task = createTaskDocument();
      task.tasksHistory = [];

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Please set your in-time first",
      });
    });

    test("completes a task successfully", async () => {
      const task = createTaskDocument();

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Task completed successfully");

      expect(data.completedTask).toMatchObject({
        taskTitle: "Learn TypeScript",
        timeTaken: expect.any(Number),
      });

      expect(data.completedTask.endTime).toMatch(
        /^([01]\d|2[0-3]):[0-5]\d$/
      );

      expect(task.activeTasks).toHaveLength(1);
      expect(task.activeTasks[0].taskTitle).toBe("Build API");

      expect(task.tasksHistory[0].taskList).toHaveLength(1);
      expect(task.tasksHistory[0].taskList[0]).toMatchObject({
        taskTitle: "Learn TypeScript",
        endTime: data.completedTask.endTime,
        timeTaken: data.completedTask.timeTaken,
      });

      expect(task.save).toHaveBeenCalledTimes(1);
    });

    test("uses the previous completed task's end time as the next task's start time", async () => {
      const task = createTaskDocument();

      task.tasksHistory[0].taskList.push({
        taskTitle: "Previous task",
        endTime: "00:00",
        timeTaken: 0,
      });

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.completedTask.timeTaken).toBeGreaterThanOrEqual(0);
      expect(task.save).toHaveBeenCalled();
    });

    test("returns 500 when database lookup fails", async () => {
      mockedFindOne.mockRejectedValue(
        new Error("Database query failed")
      );

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to complete task",
      });
    });

    test("returns 500 when saving completed task fails", async () => {
      const task = createTaskDocument();

      task.save.mockRejectedValue(
        new Error("Database save failed")
      );

      mockedFindOne.mockResolvedValue(task);

      const response = await POST(
        createRequest("POST"),
        createParams()
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to complete task",
      });
    });
  });
});
