import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const current = await requireUser(["ADMIN"]);
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : user.isActive;

  const role =
    typeof body.role === "string" ? String(body.role).toUpperCase() : user.role;

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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive,
      role,
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
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      details: {
        before: {
          role: user.role,
          isActive: user.isActive,
        },
        after: {
          role: updated.role,
          isActive: updated.isActive,
        },
      },
    },
  });

  return NextResponse.json(updated);
}
