"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

const LeadSchema = z.object({
  name: z.string().min(2, "Tell us what to call you.").max(80, "That is a very long name."),
  email: z.email("That email address does not look right."),
  phone: z.string().max(24, "That phone number is too long."),
  message: z
    .string()
    .min(10, "A sentence or two is plenty — what are you after?")
    .max(1200, "Keep it under 1200 characters and we will call you about the rest."),
});

export type LeadField = keyof z.infer<typeof LeadSchema>;

export type LeadState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<LeadField, string>>;
};

export const initialLeadState: LeadState = { status: "idle" };

/**
 * Marketing contact form → `Lead`. The admin desk works the queue from
 * /admin, so nothing here needs to email anybody.
 */
export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Honeypot: a field no human sees. Bots fill it, and we quietly agree.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "success", message: "Thanks — we will be in touch." };
  }

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };

  const parsed = LeadSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Partial<Record<LeadField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as LeadField | undefined;
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return { status: "error", message: "Have another look at the highlighted fields.", errors };
  }

  try {
    await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      },
    });
  } catch {
    return {
      status: "error",
      message: "Something broke on our side. Call the desk on +91 22 4890 1120 and we will sort it.",
    };
  }

  return {
    status: "success",
    message: "Got it. A coach will reply within one working day — usually the same afternoon.",
  };
}
