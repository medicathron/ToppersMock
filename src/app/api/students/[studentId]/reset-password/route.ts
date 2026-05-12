import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;

  const allowed = await prisma.allowedStudent.findFirst({
    where: { id: studentId, tutorId: session.user.id },
  });
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clear password and mark as unregistered so student goes through first-login again
  if (allowed.userId) {
    await prisma.user.update({
      where: { id: allowed.userId },
      data: { passwordHash: null },
    });
  }
  await prisma.allowedStudent.update({
    where: { id: studentId },
    data: { registered: false },
  });

  return NextResponse.json({ ok: true });
}
