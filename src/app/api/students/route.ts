import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.allowedStudent.findMany({
    where: { tutorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matric } = await req.json();
  const trimmed = String(matric ?? "").trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return NextResponse.json({ error: "Matric must be exactly 6 digits." }, { status: 400 });
  }

  const existing = await prisma.allowedStudent.findUnique({ where: { matric: trimmed } });
  if (existing) {
    return NextResponse.json({ error: "This matric number is already added." }, { status: 409 });
  }

  const student = await prisma.allowedStudent.create({
    data: { matric: trimmed, tutorId: session.user.id },
  });
  return NextResponse.json(student, { status: 201 });
}
