
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const userId = token ? verifyToken(token) : null;

  const { pathname } = req.nextUrl;

  if (pathname === "/" && !userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    (pathname === "/login" || pathname === "/register") &&
    userId
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
