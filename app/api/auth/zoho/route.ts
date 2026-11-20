import { getUser } from "@/utils/auth";
import { NextResponse, NextRequest } from "next/server";
import {connectDB} from "@/utils/db"; 
import User from "@/model/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { code, location = "in" } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    // 1. Exchange code for Zoho OAuth tokens
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      redirect_uri: process.env.ZOHO_REDIRECT_URI!,
      code,
    });

    const tokenRes = await fetch(`https://accounts.zoho.${location}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // 2. Fetch Zoho Mail account details
    const accountRes = await fetch(`https://mail.zoho.${location}/api/accounts`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    const account = await accountRes.json();
    const zohoAccount = account?.data?.[0];
    const zohoEmail = zohoAccount?.primaryEmailAddress?.toLowerCase().trim();
    const accountId = zohoAccount?.accountId;

    if (!zohoEmail) {
      return NextResponse.json(
        { error: "Could not retrieve email address from Zoho account." },
        { status: 400 }
      );
    }

    // 3. Check if a user with this exact email exists in your DB
    const existingUser = await User.findOne({ email: zohoEmail });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: `No account found for ${zohoEmail}. Please sign in with the same Zoho email you used to register on our app.`,
        },
        { status: 403 }
      );
    }

    // 4. Save tokens to the matched user
    const updateFields: Record<string, any> = {
      "data.accessToken": accessToken,
      "data.accountsId": accountId,
      "data.location": location,
    };

    if (refreshToken) {
      updateFields["data.refreshToken"] = refreshToken;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: zohoEmail },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      email: zohoEmail,
      data: updatedUser?.data,
    });
  } catch (error) {
    console.error("Error verifying Zoho email and saving data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  try {
    const userId = getUser(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(userId)
      .select("data.refreshToken data.accountsId")
      .lean();

    const zohoConnected = Boolean(
      user?.data?.refreshToken &&
      user?.data?.accountsId
    );

    return NextResponse.json({ zohoConnected });
  } catch (error) {
    console.error("Zoho status error:", error);

    return NextResponse.json(
      { message: "Failed to check Zoho connection" },
      { status: 500 }
    );
  }
}