import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export async function GET() {
  const user = await requireUser(["ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const current = await requireUser(["ADMIN"]);
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "").toUpperCase();

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Nama, email, password, dan role wajib diisi" },
      { status: 400 },
    );
  }

  if (
    role !== UserRole.ADMIN &&
    role !== UserRole.WAREHOUSE &&
    role !== UserRole.HEAD_CHEF
  ) {
    return NextResponse.json(
      { error: "Role tidak valid" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: current.userId,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      details: {
        name,
        email,
        role,
      },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
