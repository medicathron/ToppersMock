import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await params;

  const quizSession = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { answers: true },
  });

  if (!quizSession || quizSession.studentId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (quizSession.submittedAt) {
    return NextResponse.json({ error: "Already submitted." }, { status: 400 });
  }

  // Score server-side using stored shuffledCorrectIndex
  let score = 0;
  const updates = quizSession.answers.map((a) => {
    const isCorrect = a.selectedOption !== null && a.selectedOption === a.shuffledCorrectIndex;
    if (isCorrect) score++;
    return prisma.quizAnswer.update({
      where: { id: a.id },
      data: { isCorrect },
    });
  });

  await prisma.$transaction([
    ...updates,
    prisma.quizSession.update({
      where: { id: sessionId },
      data: { submittedAt: new Date(), score },
    }),
  ]);

  return NextResponse.json({ score, total: quizSession.numQuestions });
}
