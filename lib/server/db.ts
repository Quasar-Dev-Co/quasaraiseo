import { createHash, createHmac, randomBytes } from "crypto";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  company: string | null;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "quasar-dev-secret-change-in-production-2026";

// In-memory stores (reset on server restart)
const users = new Map<string, StoredUser>();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = createHash("sha256").update(salt + password).digest("hex");
  return computedHash === hash;
}

export function createToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { sub: string; exp: number } | null {
  try {
    const [header, payload, signature] = token.split(".");
    const expectedSignature = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; exp: number };
    if (Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return users.get(email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function createUser(data: { name: string; email: string; password: string; company?: string }): StoredUser {
  const { hash, salt } = hashPassword(data.password);
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: `usr_${randomBytes(12).toString("hex")}`,
    email: data.email.toLowerCase(),
    name: data.name,
    company: data.company ?? null,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
  };
  users.set(user.email, user);
  return user;
}

export function getAuthFromRequest(request: Request): { userId: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { userId: decoded.sub };
}
