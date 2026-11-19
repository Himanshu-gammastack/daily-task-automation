
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/tasks/route";
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

function createRequest(
  method: string,
  body?: unknown
): NextRequest {
  return new NextRequest("http://localhost:3000/api/tasks", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });
}

describe("/api/tasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetUser.mockReturnValue("user123");
    mockedConnectDB.mockResolvedValue(undefined);
  });

  describe("GET /api/tasks", () => {
    test("returns 401 when user is not authenticated", async () => {
      mockedGetUser.mockReturnValue(null);

      const response = await GET(createRequest("GET"));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Unauthorized",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("returns empty tasks when user has no task document", async () => {
      mockedFindOne.mockResolvedValue(null);

      const response = await GET(createRequest("GET"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        activeTasks: [],
        today: {
          inTime: null,
          outTime: null,
          taskList: [],
        },
      });

      expect(mockedFindOne).toHaveBeenCalledWith({
        userId: "user123",
      });
    });

    test("returns active tasks and today's history", async () => {
      const activeTasks = [
        { _id: "task1", taskTitle: "Learn TypeScript" },
        { _id: "task2", taskTitle: "Build API" },
      ];

      const todayHistory = {
        date: new Date(),
        inTime: "09:00",
        outTime: "",
        taskList: [
          {
            taskTitle: "Read documentation",
            endTime: "10:00",
            timeTaken: 60,
          },
        ],
      };

      mockedFindOne.mockResolvedValue({
        activeTasks,
        tasksHistory: [todayHistory],
      });

      const response = await GET(createRequest("GET"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activeTasks).toEqual(activeTasks);
      expect(data.today.inTime).toBe("09:00");
      expect(data.today.outTime).toBe(null);
      expect(data.today.taskList).toEqual(todayHistory.taskList);
      expect(data.today.date).toBeDefined();
    });

    test("returns null times and empty task list when today's history does not exist", async () => {
      mockedFindOne.mockResolvedValue({
        activeTasks: [{ taskTitle: "Build project" }],
        tasksHistory: [],
      });

      const response = await GET(createRequest("GET"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activeTasks).toHaveLength(1);
      expect(data.today.inTime).toBeNull();
      expect(data.today.outTime).toBeNull();
      expect(data.today.taskList).toEqual([]);
    });

    test("returns 500 when database connection fails", async () => {
      mockedConnectDB.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET(createRequest("GET"));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to fetch tasks",
      });
    });

    test("returns 500 when fetching tasks fails", async () => {
      mockedFindOne.mockRejectedValue(
        new Error("Database query failed")
      );

      const response = await GET(createRequest("GET"));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to fetch tasks",
      });
    });
  });

  describe("POST /api/tasks", () => {
    test("returns 401 when user is not authenticated", async () => {
      mockedGetUser.mockReturnValue(null);

      const response = await POST(
        createRequest("POST", {
          taskTitle: "Learn Next.js",
        })
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Unauthorized",
      });

      expect(mockedConnectDB).not.toHaveBeenCalled();
    });

    test("returns 400 when taskTitle is missing", async () => {
      const response = await POST(
        createRequest("POST", {})
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "taskTitle is required",
      });
    });

    test("returns 400 when taskTitle is empty", async () => {
      const response = await POST(
        createRequest("POST", {
          taskTitle: "   ",
        })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "taskTitle is required",
      });
    });

    test("adds a new task successfully", async () => {
      const updatedTask = {
        userId: "user123",
        activeTasks: [
          {
            _id: "task1",
            taskTitle: "Learn Next.js",
          },
        ],
      };

      mockedFindOneAndUpdate.mockResolvedValue(updatedTask);

      const response = await POST(
        createRequest("POST", {
          taskTitle: "Learn Next.js",
        })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        message: "Task added successfully",
        task: updatedTask,
      });

      expect(mockedConnectDB).toHaveBeenCalled();

      expect(mockedFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: "user123" },
        {
          $push: {
            activeTasks: {
              taskTitle: "Learn Next.js",
            },
          },
          $setOnInsert: {
            userId: "user123",
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );
    });

    test("trims whitespace from task title before saving", async () => {
      mockedFindOneAndUpdate.mockResolvedValue({
        activeTasks: [{ taskTitle: "Learn React" }],
      });

      await POST(
        createRequest("POST", {
          taskTitle: "  Learn React  ",
        })
      );

      expect(mockedFindOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        {
          $push: {
            activeTasks: {
              taskTitle: "Learn React",
            },
          },
          $setOnInsert: {
            userId: "user123",
          },
        },
        expect.anything()
      );
    });

    test("returns 500 when adding a task fails", async () => {
      mockedFindOneAndUpdate.mockRejectedValue(
        new Error("Database update failed")
      );

      const response = await POST(
        createRequest("POST", {
          taskTitle: "Learn React",
        })
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Failed to add task",
      });
    });
  });
});
