import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { sessionId } = await params;

    const quizSession = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { answers: true, course: { select: { code: true } } },
    });

    if (!quizSession || quizSession.studentId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (quizSession.submittedAt) {
      return NextResponse.json({ error: "Already submitted." }, { status: 400 });
    }

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

    // Best-effort score sync back to Toppers Tutorial
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { matric: true },
    });
    if (student?.matric?.startsWith("TT/") && process.env.TOPPERS_BACKEND_URL) {
      fetch(`${process.env.TOPPERS_BACKEND_URL}/api/quiz/mock-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mock-Secret": process.env.TOPPERS_SSO_SECRET ?? "",
        },
        body: JSON.stringify({
          tutorialId: student.matric,
          course: quizSession.course.code,
          score,
          total: quizSession.numQuestions,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ score, total: quizSession.numQuestions });
  } catch (e) {
    console.error("[quiz/sessionId/submit]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
