import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matric, surname, firstname, phone, gender, faculty, dept, aimedScore, password } = body;

    if (!matric || !surname || !firstname || !phone || !gender || !faculty || !dept || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(matric)) {
      return NextResponse.json({ error: "Invalid matric number." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const allowed = await prisma.allowedStudent.findUnique({ where: { matric } });
    if (!allowed) return NextResponse.json({ error: "Matric not whitelisted." }, { status: 403 });
    if (allowed.registered && allowed.userId) {
      return NextResponse.json({ error: "Already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        matric,
        passwordHash,
        role: "STUDENT",
        studentProfile: {
          create: {
            matric,
            surname: surname.toUpperCase().trim(),
            firstname: firstname.trim(),
            phone: phone.trim(),
            gender,
            faculty,
            dept,
            aimedScore: parseInt(aimedScore) || 70,
          },
        },
      },
    });

    await prisma.allowedStudent.update({
      where: { matric },
      data: { registered: true, userId: user.id },
    });

    return NextResponse.json({ id: user.id });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
