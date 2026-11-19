
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";

import { connectDB } from "@/utils/db";
import { generateToken } from "@/utils/auth";
import User from "@/model/User";

jest.mock("@/utils/db", () => ({
  connectDB: jest.fn(),
}));

jest.mock("@/utils/auth", () => ({
  generateToken: jest.fn(),
}));

jest.mock("@/model/User", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const mockedConnectDB = connectDB as jest.Mock;
const mockedGenerateToken = generateToken as jest.Mock;
const mockedFindOne = User.findOne as jest.Mock;
const mockedCreate = User.create as jest.Mock;
const mockedHash = bcrypt.hash as jest.Mock;
const mockedCompare = bcrypt.compare as jest.Mock;

function createRequest(
  url: string,
  body: unknown
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/api/auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedConnectDB.mockResolvedValue(undefined);
  });

  // =====================================
  // REGISTER
  // =====================================

  describe("POST /api/auth/register", () => {
    const validUser = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    test("returns 400 when all fields are missing", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {}
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when name is missing", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            email: validUser.email,
            password: validUser.password,
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when email is missing", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            name: validUser.name,
            password: validUser.password,
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when password is missing", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            name: validUser.name,
            email: validUser.email,
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when name contains only whitespace", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            ...validUser,
            name: "   ",
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when email contains only whitespace", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            ...validUser,
            email: "   ",
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "All fields are required",
      });
    });

    test("returns 400 when password is shorter than 8 characters", async () => {
      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            ...validUser,
            password: "1234567",
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Password must be at least 8 characters",
      });

      expect(mockedFindOne).not.toHaveBeenCalled();
    });

    test("returns 409 when email is already registered", async () => {
      mockedFindOne.mockResolvedValue({
        email: validUser.email,
      });

      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          validUser
        )
      );

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        message: "Email already registered",
      });

      expect(mockedCreate).not.toHaveBeenCalled();
    });

    test("checks existing email in lowercase and trimmed format", async () => {
      mockedFindOne.mockResolvedValue(null);
      mockedHash.mockResolvedValue("hashed-password");

      mockedCreate.mockResolvedValue({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      });

      await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            ...validUser,
            email: "  JOHN@EXAMPLE.COM  ",
          }
        )
      );

      expect(mockedFindOne).toHaveBeenCalledWith({
        email: "john@example.com",
      });
    });

    test("registers a new user successfully", async () => {
      mockedFindOne.mockResolvedValue(null);
      mockedHash.mockResolvedValue("hashed-password");

      mockedCreate.mockResolvedValue({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      });

      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          validUser
        )
      );

      expect(response.status).toBe(201);

      expect(await response.json()).toEqual({
        message: "Registration successful",
        user: {
          id: "user123",
          name: "John Doe",
          email: "john@example.com",
        },
      });

      expect(mockedHash).toHaveBeenCalledWith(
        "password123",
        12
      );

      expect(mockedCreate).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      });
    });

    test("trims name and normalizes email before saving", async () => {
      mockedFindOne.mockResolvedValue(null);
      mockedHash.mockResolvedValue("hashed-password");

      mockedCreate.mockResolvedValue({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      });

      await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          {
            name: "  John Doe  ",
            email: "  JOHN@EXAMPLE.COM  ",
            password: "password123",
          }
        )
      );

      expect(mockedCreate).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      });
    });

    test("returns 500 when database connection fails", async () => {
      mockedConnectDB.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          validUser
        )
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Registration failed",
      });
    });

    test("returns 500 when user creation fails", async () => {
      mockedFindOne.mockResolvedValue(null);
      mockedHash.mockResolvedValue("hashed-password");

      mockedCreate.mockRejectedValue(
        new Error("User creation failed")
      );

      const response = await register(
        createRequest(
          "http://localhost:3000/api/auth/register",
          validUser
        )
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Registration failed",
      });
    });
  });

  // =====================================
  // LOGIN
  // =====================================

  describe("POST /api/auth/login", () => {
    const validCredentials = {
      email: "john@example.com",
      password: "password123",
    };

    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
      password: "hashed-password",
    };

    test("returns 400 when email and password are missing", async () => {
      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          {}
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Email and password are required",
      });
    });

    test("returns 400 when email is missing", async () => {
      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          {
            password: validCredentials.password,
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Email and password are required",
      });
    });

    test("returns 400 when password is missing", async () => {
      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          {
            email: validCredentials.email,
          }
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        message: "Email and password are required",
      });
    });

    test("returns 401 when user does not exist", async () => {
      mockedFindOne.mockResolvedValue(null);

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Invalid email or password",
      });

      expect(mockedCompare).not.toHaveBeenCalled();
    });

    test("returns 401 when password does not match", async () => {
      mockedFindOne.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(false);

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        message: "Invalid email or password",
      });

      expect(mockedCompare).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );

      expect(mockedGenerateToken).not.toHaveBeenCalled();
    });

    test("logs in successfully and returns user details", async () => {
      mockedFindOne.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(true);
      mockedGenerateToken.mockReturnValue("mock-jwt-token");

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      expect(response.status).toBe(200);

      expect(await response.json()).toEqual({
        message: "Login successful",
        user: {
          id: "user123",
          name: "John Doe",
          email: "john@example.com",
        },
      });

      expect(mockedGenerateToken).toHaveBeenCalledWith(
        "user123"
      );
    });

    test("sets the authentication cookie correctly", async () => {
      mockedFindOne.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(true);
      mockedGenerateToken.mockReturnValue("mock-jwt-token");

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      const cookie = response.cookies.get("token");

      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe("mock-jwt-token");
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe("lax");
      expect(cookie?.path).toBe("/");
      expect(cookie?.maxAge).toBe(7 * 24 * 60 * 60);
    });

    test("returns 500 when database connection fails", async () => {
      mockedConnectDB.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Login failed",
      });
    });

    test("returns 500 when password comparison fails", async () => {
      mockedFindOne.mockResolvedValue(mockUser);

      mockedCompare.mockRejectedValue(
        new Error("Password comparison failed")
      );

      const response = await login(
        createRequest(
          "http://localhost:3000/api/auth/login",
          validCredentials
        )
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Login failed",
      });
    });
  });
});
