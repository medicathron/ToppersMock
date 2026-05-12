import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { selectAndShuffleQuestions } from "@/lib/quiz";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { courseId, numQuestions } = await req.json();
  if (!courseId || !numQuestions) return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const allQuestions = await prisma.question.findMany({ where: { courseId } });
  if (allQuestions.length < numQuestions) {
    return NextResponse.json(
      { error: `Not enough questions. Course only has ${allQuestions.length}.` },
      { status: 400 }
    );
  }

  const shuffled = selectAndShuffleQuestions(allQuestions, numQuestions);
  const timeLimitSeconds = numQuestions * course.timePerQuestion;

  const session2 = await prisma.quizSession.create({
    data: {
      studentId: session.user.id,
      courseId,
      numQuestions,
      timeLimitSeconds,
      answers: {
        create: shuffled.map((q, i) => ({
          questionId: q.questionId,
          questionOrder: i,
          shuffledOptions: JSON.stringify(q.shuffledOptions),
          shuffledCorrectIndex: q.shuffledCorrectIndex,
        })),
      },
    },
  });

  return NextResponse.json({ sessionId: session2.id });
}
