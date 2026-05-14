import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { courseId } = await params;

    const course = await prisma.course.findFirst({ where: { id: courseId, tutorId: session.user.id } });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sessions = await prisma.quizSession.findMany({
      where: { courseId, submittedAt: { not: null } },
      include: { student: { include: { studentProfile: true } } },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ course, sessions });
  } catch (e) {
    console.error("[courses/courseId/results]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
