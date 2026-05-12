import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTutorCourse(tutorId: string, courseId: string) {
  return prisma.course.findFirst({ where: { id: courseId, tutorId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { questions: { orderBy: { createdAt: "desc" } } },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;

  const course = await getTutorCourse(session.user.id, courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.code && { code: body.code.trim().toUpperCase() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.timePerQuestion !== undefined && { timePerQuestion: parseInt(body.timePerQuestion) }),
      ...(body.resultsReleased !== undefined && { resultsReleased: Boolean(body.resultsReleased) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;

  const course = await getTutorCourse(session.user.id, courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.course.delete({ where: { id: courseId } });
  return NextResponse.json({ ok: true });
}
