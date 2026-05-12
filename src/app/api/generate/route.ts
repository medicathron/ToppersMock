import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateQuestions, generateQuestionsFromImage } from "@/lib/claude";
import { extractTextFromPdf, extractTextFromDocx } from "@/lib/parsers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const count = parseInt(formData.get("count") as string) || 10;
  const topic = formData.get("topic") as string | null;
  const file = formData.get("file") as File | null;

  let questions;

  if (topic?.trim()) {
    questions = await generateQuestions(topic.trim(), count, true);
  } else if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;

    if (type === "application/pdf" || file.name.endsWith(".pdf")) {
      const text = await extractTextFromPdf(buffer);
      if (!text.trim()) return NextResponse.json({ error: "Could not extract text from PDF." }, { status: 400 });
      questions = await generateQuestions(text, count);
    } else if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const text = await extractTextFromDocx(buffer);
      if (!text.trim()) return NextResponse.json({ error: "Could not extract text from document." }, { status: 400 });
      questions = await generateQuestions(text, count);
    } else if (type.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      questions = await generateQuestionsFromImage(base64, type, count);
    } else if (type === "text/plain" || file.name.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      questions = await generateQuestions(text, count);
    } else {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Provide either a topic or a file." }, { status: 400 });
  }

  return NextResponse.json(questions);
}
