import "server-only";
import bcrypt from "bcryptjs";
import { getDb } from "../store";
import type { LoginInput, SignupInput } from "../validation";
import type { PublicUser } from "../types";
import { ConflictError } from "./errors";

function toPublicUser(user: { id: string; name: string; email: string }): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export async function verifyCredentials(input: LoginInput): Promise<PublicUser | null> {
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (!user) {
    // Run a hash comparison anyway so response timing doesn't reveal
    // whether the email exists (mitigates user enumeration via timing).
    await bcrypt.compare(input.password, "$2a$10$invalidsaltinvalidsaltinvalidsaltinva");
    return null;
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) return null;
  return toPublicUser(user);
}

export async function createUser(input: SignupInput): Promise<PublicUser> {
  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = {
    id: `user-${crypto.randomUUID()}`,
    name: input.name,
    email: input.email,
    passwordHash,
  };
  db.users.push(user);
  return toPublicUser(user);
}
