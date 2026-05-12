import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMatricCsv } from "@/lib/csv";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    const text = await file.text();
    const { valid, invalid } = parseMatricCsv(text);

    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid matric numbers found in the CSV.", invalid }, { status: 400 });
    }

    let added = 0;
    let skipped = 0;
    for (const matric of valid) {
      const existing = await prisma.allowedStudent.findUnique({ where: { matric } });
      if (existing) { skipped++; continue; }
      await prisma.allowedStudent.create({ data: { matric, tutorId: session.user.id } });
      added++;
    }

    return NextResponse.json({ added, skipped, invalid });
  } catch (e) {
    console.error("[students/upload]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
