import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;

  const student = await prisma.allowedStudent.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.allowedStudent.delete({ where: { id: studentId } });
  return NextResponse.json({ ok: true });
}
