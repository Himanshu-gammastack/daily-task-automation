
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {connectDB} from "@/utils/db";
import User from "@/model/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}
