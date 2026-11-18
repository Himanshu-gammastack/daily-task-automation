
import { NextRequest } from "next/server";
import { verifyToken } from "./auth";

export function getUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  return verifyToken(token);
}
