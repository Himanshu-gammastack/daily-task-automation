
import { NextRequest } from "next/server";
import { POST } from "@/app/api/endDay/route";
import { connectDB } from "@/utils/db";
import Task from "@/model/Tasks";
import { getUser } from "@/utils/auth";
import { sendDailyUpdate } from "@/app/api/endDay/controller/sendMail";
import { updateZohoWorksheet } from "@/app/api/endDay/controller/updateSheet";
import { getZohoAccessToken } from "@/app/api/endDay/controller/getAuthToken";

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
  },
}));

jest.mock("@/app/api/endDay/controller/sendMail.ts", () => ({
  sendDailyUpdate: jest.fn(),
}));

jest.mock("@/app/api/endDay/controller/updateSheet.ts", () => ({
  updateZohoWorksheet: jest.fn(),
}));

jest.mock("@/app/api/endDay/controller/getAuthToken.ts", () => ({
  getZohoAccessToken: jest.fn(),
}));

const mockedGetUser = jest.mocked(getUser);
const mockedConnectDB = jest.mocked(connectDB);
const mockedSendMail = jest.mocked(sendDailyUpdate);
const mockedUpdateSheet = jest.mocked(updateZohoWorksheet);
const mockedGetToken = jest.mocked(getZohoAccessToken);
const mockedFindOne = jest.mocked(Task.findOne);

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/endDay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getTodayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function createHistory() {
  const dateString = getTodayIST();
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day) - 330 * 60 * 1000
  );

  return {
    date,
    inTime: "00:00",
    outTime: "",
    taskList: [
      {
        taskTitle: "Complete project",
        endTime: "01:00",
        timeTaken: 1,
      },
      {
        taskTitle: "Write documentation",
        endTime: "02:00",
        timeTaken: 1,
      },
    ],
  };
}

function mockDatabase(history = createHistory()) {
  const document = {
    tasksHistory: [history],
    save: jest.fn().mockResolvedValue(undefined),
  };

  mockedFindOne
    .mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        tasksHistory: [history],
      }),
    } as never)
    .mockResolvedValueOnce(document as never);

  return document;
}

describe("POST /api/endDay", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetUser.mockReturnValue("user123");
    mockedConnectDB.mockResolvedValue(undefined);
    mockedGetToken.mockResolvedValue("mock-zoho-token");
    mockedSendMail.mockResolvedValue({
      success: true,
    } as never);
    mockedUpdateSheet.mockResolvedValue({
      success: true,
    } as never);

    process.env.DAILY_UPDATE_TO = "test@example.com";
  });

  test("rejects missing date", async () => {
    const response = await POST(createRequest({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Invalid date. Use YYYY-MM-DD.",
    });
  });

  test.each(["19-11-2026", "2026/11/19", "invalid", 123, null])(
    "rejects invalid date: %s",
    async (date) => {
      const response = await POST(createRequest({ date }));

      expect(response.status).toBe(400);
    }
  );

  test("returns 401 when user is unauthenticated", async () => {
    mockedGetUser.mockReturnValue(null);

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(401);
  });

  test("returns 404 when user task document does not exist", async () => {
    mockedFindOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(null),
    } as never);
  
    const response = await POST(
      createRequest({ date: getTodayIST() })
    );
  
    expect(response.status).toBe(404);
  
    expect(await response.json()).toMatchObject({
      success: false,
      message: "User task record not found",
    });
  });

  test("returns 404 when daily history does not exist", async () => {
    mockedFindOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        tasksHistory: [],
      }),
    } as never);

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      message: "No task history found for this date",
    });
  });

  test("returns 400 when no completed tasks exist", async () => {
    const history = createHistory();
    history.taskList = [];

    mockedFindOne.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        tasksHistory: [history],
      }),
    } as never);

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: "No completed tasks found",
    });
  });

  test("generates report and calls Zoho services successfully", async () => {
    const history = createHistory();
    const document = mockDatabase(history);

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Daily report generated successfully");

    expect(data.report.taskBreakdown).toHaveLength(2);
    expect(data.report.totalHours).toBeGreaterThan(0);

    expect(mockedGetToken).toHaveBeenCalledTimes(1);
    expect(mockedSendMail).toHaveBeenCalledTimes(1);
    expect(mockedUpdateSheet).toHaveBeenCalledTimes(1);

    expect(document.tasksHistory[0].outTime).not.toBe("");
    expect(document.save).toHaveBeenCalledTimes(1);
  });

  test("returns 500 when Zoho token retrieval fails", async () => {
    mockedGetToken.mockRejectedValue(
      new Error("Token request failed")
    );

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Token request failed",
    });
  });

  test("returns 500 when email sending fails", async () => {
    mockDatabase();

    mockedSendMail.mockRejectedValue(
      new Error("Email sending failed")
    );

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Email sending failed",
    });
  });

  test("returns 500 when Zoho Sheet update fails", async () => {
    mockDatabase();

    mockedUpdateSheet.mockRejectedValue(
      new Error("Sheet update failed")
    );

    const response = await POST(
      createRequest({ date: getTodayIST() })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      message: "Sheet update failed",
    });
  });


    test("rejects a task completed at the check-in time", async () => {
      const history = createHistory();

      history.taskList = [
        {
          taskTitle: "Invalid task",
          endTime: "00:00",
          timeTaken: 0,
        },
      ];

      mockedFindOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({
          tasksHistory: [history],
        }),
      } as never);

      const response = await POST(
        createRequest({ date: getTodayIST() })
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({
        success: false,
        message: expect.stringContaining("Invalid completion time"),
      });
    });
});
