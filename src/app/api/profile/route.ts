import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT")
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { firstname, surname, phone, dept, faculty, aimedScore } = await req.json();

  if (!firstname || !surname || !phone || !dept || !faculty)
    return Response.json({ error: "All fields are required." }, { status: 400 });

  const scored = Number(aimedScore);
  if (isNaN(scored) || scored < 0 || scored > 100)
    return Response.json({ error: "Invalid target score." }, { status: 400 });

  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { firstname, surname, phone, dept, faculty, aimedScore: scored },
  });

  return Response.json({ ok: true });
}
