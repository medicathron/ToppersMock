import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { studentId } = await params;

    const allowed = await prisma.allowedStudent.findFirst({
      where: { id: studentId, tutorId: session.user.id },
    });
    if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  } catch (e) {
    console.error("[students/studentId/reset-password]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
