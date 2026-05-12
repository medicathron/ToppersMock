import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "TUTOR",
        tutorProfile: { create: { name: name.trim() } },
      },
    });

    return NextResponse.json({ id: user.id });
  } catch (e) {
    console.error("[tutor/register]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
