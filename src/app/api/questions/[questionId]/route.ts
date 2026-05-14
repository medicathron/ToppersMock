import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { questionId } = await params;

    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { course: true } });
    if (!question || question.course.tutorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(body.questionText && { questionText: body.questionText }),
        ...(body.options && { options: JSON.stringify(body.options) }),
        ...(body.correctAnswerIndex !== undefined && { correctAnswerIndex: body.correctAnswerIndex }),
        ...(body.explanation !== undefined && { explanation: body.explanation ?? null }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[questions/questionId]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { questionId } = await params;

    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { course: true } });
    if (!question || question.course.tutorId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[questions/questionId]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
