import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const SQL = `
CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT, "matric" TEXT, "passwordHash" TEXT, "role" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "TutorProfile" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "AllowedStudent" ("id" TEXT NOT NULL PRIMARY KEY, "matric" TEXT NOT NULL, "tutorId" TEXT NOT NULL, "registered" BOOLEAN NOT NULL DEFAULT false, "userId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "StudentProfile" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "matric" TEXT NOT NULL, "surname" TEXT NOT NULL, "firstname" TEXT NOT NULL, "phone" TEXT NOT NULL, "gender" TEXT NOT NULL, "faculty" TEXT NOT NULL, "dept" TEXT NOT NULL, "aimedScore" INTEGER NOT NULL DEFAULT 70, CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Course" ("id" TEXT NOT NULL PRIMARY KEY, "tutorId" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL, "description" TEXT, "timePerQuestion" INTEGER NOT NULL DEFAULT 60, "resultsReleased" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Course_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "Question" ("id" TEXT NOT NULL PRIMARY KEY, "courseId" TEXT NOT NULL, "questionText" TEXT NOT NULL, "options" TEXT NOT NULL, "correctAnswerIndex" INTEGER NOT NULL, "explanation" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Question_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "QuizSession" ("id" TEXT NOT NULL PRIMARY KEY, "studentId" TEXT NOT NULL, "courseId" TEXT NOT NULL, "numQuestions" INTEGER NOT NULL, "timeLimitSeconds" INTEGER NOT NULL, "timeElapsed" INTEGER NOT NULL DEFAULT 0, "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" DATETIME, "score" INTEGER, CONSTRAINT "QuizSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "QuizSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE IF NOT EXISTS "QuizAnswer" ("id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "questionId" TEXT NOT NULL, "questionOrder" INTEGER NOT NULL, "shuffledOptions" TEXT NOT NULL, "shuffledCorrectIndex" INTEGER NOT NULL, "selectedOption" INTEGER, "isCorrect" BOOLEAN, CONSTRAINT "QuizAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_matric_key" ON "User"("matric");
CREATE UNIQUE INDEX IF NOT EXISTS "TutorProfile_userId_key" ON "TutorProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AllowedStudent_matric_key" ON "AllowedStudent"("matric");
CREATE UNIQUE INDEX IF NOT EXISTS "AllowedStudent_userId_key" ON "AllowedStudent"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_matric_key" ON "StudentProfile"("matric");
CREATE UNIQUE INDEX IF NOT EXISTS "QuizAnswer_sessionId_questionOrder_key" ON "QuizAnswer"("sessionId", "questionOrder");
`;

export async function GET() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  if (!url) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });

  const client = createClient({ url, authToken });

  const statements = SQL.trim().split("\n").map((s) => s.trim()).filter(Boolean);
  const results: string[] = [];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      results.push(`OK: ${stmt.slice(0, 60)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`ERR: ${msg}`);
    }
  }

  return NextResponse.json({ done: true, results });
}
