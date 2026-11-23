
import { NextRequest } from "next/server";
import { POST } from "@/app/api/startDay/route";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { getUser } from "@/utils/auth";

jest.mock("@/utils/db", () => ({
  connectDB: jest.fn(),
}));

jest.mock("@/utils/auth", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/model/Tasks", () => {
  const MockTask = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return {
    __esModule: true,
    default: MockTask,
  };
});

const mockedGetUser = jest.mocked(getUser);
const mockedConnectDB = jest.mocked(connectDB);
const MockTask = Task as unknown as jest.Mock & {
  findOne: jest.Mock;
};

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/startDay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/startDay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetUser.mockReturnValue("user123");
    mockedConnectDB.mockResolvedValue(undefined);
  });

  test("returns 401 when user is not authenticated", async () => {
    mockedGetUser.mockReturnValue(null);

    const response = await POST(createRequest({ inTime: "09:00" }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("Unauthorized");
    expect(MockTask.findOne).not.toHaveBeenCalled();
  });

  test("returns 400 when inTime is missing", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("Invalid inTime");
  });

  test.each(["25:00", "09:70", "9:30", "abc", ""])(
    "rejects invalid time: %s",
    async (inTime) => {
      const response = await POST(createRequest({ inTime }));

      expect(response.status).toBe(400);
    }
  );

  test("connects to database after validating input", async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);

    MockTask.findOne.mockResolvedValue({
      tasksHistory: [],
      save: mockSave,
    });

    await POST(createRequest({ inTime: "09:30" }));

    expect(mockedConnectDB).toHaveBeenCalledTimes(1);
  });

  test("creates a new task document when user has no document", async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);

    MockTask.findOne.mockResolvedValue(null);

    MockTask.mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    const response = await POST(
      createRequest({ inTime: "09:30" })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("In-time saved successfully");
    expect(data.inTime).toBe("09:30");

    expect(MockTask).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        activeTasks: [],
        tasksHistory: expect.arrayContaining([
          expect.objectContaining({
            inTime: "09:30",
            outTime: "",
            taskList: [],
          }),
        ]),
      })
    );

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  test("creates today's history when task document already exists", async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);

    const existingTask = {
      tasksHistory: [],
      save: mockSave,
    };

    MockTask.findOne.mockResolvedValue(existingTask);

    const response = await POST(
      createRequest({ inTime: "10:00" })
    );

    expect(response.status).toBe(200);
    expect(existingTask.tasksHistory).toHaveLength(1);
    expect(existingTask.tasksHistory[0].inTime).toBe("10:00");
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  test("updates today's existing history", async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);

    const todayIST = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const [year, month, day] = todayIST.split("-").map(Number);

    const today = new Date(
      Date.UTC(year, month - 1, day) - 330 * 60 * 1000
    );

    const existingHistory = {
      date: today,
      inTime: "08:00",
      outTime: "",
      taskList: [],
    };

    const existingTask: {
      tasksHistory: {
        date: Date;
        inTime: string;
        outTime: string;
        taskList: unknown[];
      }[];
      save: jest.Mock;
    } = {
      tasksHistory: [existingHistory],
      save: mockSave,
    };

    MockTask.findOne.mockResolvedValue(existingTask);

    const response = await POST(
      createRequest({ inTime: "09:15" })
    );

    expect(response.status).toBe(200);
    expect(existingHistory.inTime).toBe("09:15");
    expect(existingTask.tasksHistory).toHaveLength(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  test("returns 500 when database operation fails", async () => {
    MockTask.findOne.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await POST(
      createRequest({ inTime: "09:30" })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Failed to save in-time",
    });
  });
});
