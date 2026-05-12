import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { courseId } = await params;

    const questions = await prisma.question.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(questions);
  } catch (e) {
    console.error("[courses/courseId/questions]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { courseId } = await params;

    const course = await prisma.course.findFirst({ where: { id: courseId, tutorId: session.user.id } });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const questions = Array.isArray(body) ? body : [body];

    const created = await prisma.$transaction(
      questions.map((q) =>
        prisma.question.create({
          data: {
            courseId,
            questionText: q.question ?? q.questionText,
            options: JSON.stringify(q.options),
            correctAnswerIndex: q.correctIndex ?? q.correctAnswerIndex,
            explanation: q.explanation ?? null,
          },
        })
      )
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[courses/courseId/questions]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
