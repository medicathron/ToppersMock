import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    where: { tutorId: session.user.id },
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, code, description, timePerQuestion } = await req.json();
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      tutorId: session.user.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      timePerQuestion: parseInt(timePerQuestion) || 60,
    },
  });
  return NextResponse.json(course, { status: 201 });
}
