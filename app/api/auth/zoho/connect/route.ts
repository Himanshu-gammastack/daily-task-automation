import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/utils/auth";

export async function GET(req: NextRequest) {
  const userId = getUser(req);

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  const scope = process.env.ZOHO_ACCOUNT_SCOPE;

  if (!clientId || !redirectUri || !scope) {
    return NextResponse.json(
      { message: "Zoho OAuth configuration missing" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope,
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.zoho.in/oauth/v2/auth?${params.toString()}`
  );
}