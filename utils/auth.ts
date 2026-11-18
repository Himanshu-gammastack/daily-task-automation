import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export function generateToken(userId: string) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

export function getUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
}