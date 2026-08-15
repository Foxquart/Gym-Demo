"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*  Shared shapes                                                             */
/* -------------------------------------------------------------------------- */

/** The state every auth form carries between submissions. */
export type AuthState = {
  ok?: boolean;
  /** Form-level message — bad credentials, taken email, saved confirmation. */
  message?: string;
  /** Per-input messages, keyed by the input's `name`. */
  fieldErrors?: Record<string, string>;
};

/** Zod issues → a flat `{ inputName: firstMessage }` map the forms can render. */
function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * `?next=` comes from the middleware, but it also comes from the address bar.
 * Only same-origin absolute paths get through — never `//evil.com`.
 */
function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

const emailField = z.email("That doesn't look like an email address.").trim().toLowerCase();

const passwordField = z
  .string()
  .min(8, "Eight characters minimum — this one guards your training history.");

/* -------------------------------------------------------------------------- */
/*  Register                                                                  */
/* -------------------------------------------------------------------------- */

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "We need something to put on your locker tag."),
    email: emailField,
    phone: z
      .string()
      .trim()
      .max(20, "That's longer than any phone number we've seen.")
      .optional()
      .or(z.literal("")),
    password: passwordField,
    confirmPassword: z.string(),
    goal: z.string().trim().max(140, "Keep the goal to a sentence — you can edit it later.").optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords don't match.",
  });

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    goal: formData.get("goal") ?? "",
  });

  if (!parsed.success) {
    return { message: "Have another look at the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, email, phone, password, goal } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      message: "That email already has a membership.",
      fieldErrors: { email: "Already registered — sign in instead, or use a different address." },
    };
  }

  let created;
  try {
    created = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone ? phone : null,
        goal: goal ? goal : null,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch {
    // Unique constraint can still fire if two signups race for the same email.
    return {
      message: "That email already has a membership.",
      fieldErrors: { email: "Already registered — sign in instead, or use a different address." },
    };
  }

  await createSession({
    sub: created.id,
    email: created.email,
    name: created.name,
    role: created.role,
  });

  // redirect() throws by design — it must sit outside the try/catch above.
  redirect(safeNext(formData.get("next")) ?? "/dashboard");
}

/* -------------------------------------------------------------------------- */
/*  Login                                                                     */
/* -------------------------------------------------------------------------- */

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });

  // Same message either way — never confirm which emails exist.
  const wrong: AuthState = { message: "That email and password don't match a membership." };
  if (!user) return wrong;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return wrong;

  await createSession({ sub: user.id, email: user.email, name: user.name, role: user.role });

  const destination = user.role === "ADMIN" ? "/admin" : (safeNext(formData.get("next")) ?? "/dashboard");
  redirect(destination);
}

/* -------------------------------------------------------------------------- */
/*  Logout                                                                    */
/* -------------------------------------------------------------------------- */

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

/* -------------------------------------------------------------------------- */
/*  Profile                                                                   */
/* -------------------------------------------------------------------------- */

const profileSchema = z.object({
  name: z.string().trim().min(2, "We need something to put on your locker tag."),
  phone: z.string().trim().max(20, "That's longer than any phone number we've seen.").optional().or(z.literal("")),
  goal: z.string().trim().max(140, "One sentence is plenty. Specific beats poetic.").optional().or(z.literal("")),
  avatarUrl: z
    .union([z.literal(""), z.url("Paste a full image URL, starting with https://")])
    .optional(),
});

export async function updateProfile(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    goal: formData.get("goal") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
  });

  if (!parsed.success) {
    return { message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, phone, goal, avatarUrl } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: phone ? phone : null,
      goal: goal ? goal : null,
      avatarUrl: avatarUrl ? avatarUrl : null,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // The name lives in the JWT too — re-issue it so the sidebar chip agrees.
  await createSession({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
  });

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
}

/* -------------------------------------------------------------------------- */
/*  Password                                                                  */
/* -------------------------------------------------------------------------- */

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The two passwords don't match.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "That's the password you already have.",
  });

export async function changePassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const current = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { message: "Check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const record = await prisma.user.findUnique({
    where: { id: current.id },
    select: { passwordHash: true },
  });
  if (!record) return { message: "We couldn't find your account. Try signing in again." };

  if (!(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return {
      message: "Current password is wrong.",
      fieldErrors: { currentPassword: "That isn't your current password." },
    };
  }

  await prisma.user.update({
    where: { id: current.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true, message: "Password changed. The new one is live from now on." };
}
