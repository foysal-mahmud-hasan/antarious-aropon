import { SignJWT, jwtVerify } from 'jose';

/**
 * Local-build auth: dev OTP + own JWT session. Designed to be swapped for Supabase Auth + a real
 * SMS provider later (the tRPC contract stays the same). The OTP store is in-process, which is fine
 * for a single-instance droplet deployment.
 */

const OTP_TTL_MS = 5 * 60_000;
const otpStore = new Map<string, { code: string; expires: number }>();

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Generate + store a 6-digit OTP for a phone. Returned to the caller in dev (no SMS gateway). */
export function issueOtp(phone: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(phone, { code, expires: Date.now() + OTP_TTL_MS });
  return code;
}

export function checkOtp(phone: string, code: string): boolean {
  const rec = otpStore.get(phone);
  if (!rec || rec.expires < Date.now()) return false;
  const ok = rec.code === code;
  if (ok) otpStore.delete(phone);
  return ok;
}

export interface SessionClaims {
  sub: string; // user id
  phone: string;
}

export async function signSession(secret: string, claims: SessionClaims): Promise<string> {
  return new SignJWT({ phone: claims.phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey(secret));
}

export async function verifySession(secret: string, token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (!payload.sub || typeof payload.phone !== 'string') return null;
    return { sub: payload.sub, phone: payload.phone };
  } catch {
    return null;
  }
}
