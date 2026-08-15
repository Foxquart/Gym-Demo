import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe half of the auth module: JWT signing/verification only.
 * Kept separate from `auth.ts` because middleware runs on the edge runtime,
 * where bcrypt, Prisma and next/headers are unavailable.
 */

export const SESSION_COOKIE = "ember_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = "USER" | "ADMIN";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: SessionRole;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters. See .env.example");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as SessionRole,
    };
  } catch {
    return null;
  }
}
