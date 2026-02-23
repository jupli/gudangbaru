import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { UserRole } from "@/generated/prisma/enums";

const AUTH_COOKIE = "auth_token";

type AuthPayload = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

export async function createLoginSession(payload: AuthPayload) {
  const token = jwt.sign(payload, getAuthSecret(), { expiresIn: "12h" });

  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearLoginSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getCurrentUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getAuthSecret());
    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

export async function requireUser(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
