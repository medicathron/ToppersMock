import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;

  const quizSession = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        orderBy: { questionOrder: "asc" },
        include: { question: { select: { questionText: true } } },
      },
      course: { select: { name: true, code: true, resultsReleased: true } },
    },
  });

  if (!quizSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quizSession.studentId !== session.user.id && session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Never expose shuffledCorrectIndex to client
  const safeAnswers = quizSession.answers.map(({ shuffledCorrectIndex: _omit, question, ...rest }) => ({
    ...rest,
    questionText: question.questionText,
    shuffledOptions: JSON.parse(rest.shuffledOptions as string),
  }));

  return NextResponse.json({ ...quizSession, answers: safeAnswers });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;

  const quizSession = await prisma.quizSession.findUnique({ where: { id: sessionId } });
  if (!quizSession || quizSession.studentId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (quizSession.submittedAt) return NextResponse.json({ error: "Already submitted." }, { status: 400 });

  const { timeElapsed, answers } = await req.json();

  await prisma.$transaction(async (tx) => {
    if (timeElapsed !== undefined) {
      await tx.quizSession.update({ where: { id: sessionId }, data: { timeElapsed } });
    }
    if (answers && Array.isArray(answers)) {
      for (const { id, selectedOption } of answers) {
        await tx.quizAnswer.update({ where: { id }, data: { selectedOption } });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
