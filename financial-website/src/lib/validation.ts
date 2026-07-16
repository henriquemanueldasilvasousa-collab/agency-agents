import { z } from "zod";
import { CATEGORIES } from "./types";

export const EmailSchema = z.string().trim().toLowerCase().email({ message: "Enter a valid email address." }).max(254);

export const PasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(128)
  .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { message: "Password is required." }).max(128),
});

export const SignupSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: EmailSchema,
  password: PasswordSchema,
});

// Strip characters that have no legitimate place in free-text fields
// (control chars incl. null bytes) as defense-in-depth against injection,
// even though React escapes output by default. Built via String.fromCharCode
// rather than a literal escape sequence to keep the source file plain ASCII.
const CONTROL_CHAR_START = String.fromCharCode(0);
const CONTROL_CHAR_END = String.fromCharCode(31);
const DEL_CHAR = String.fromCharCode(127);
const CONTROL_CHARS = new RegExp(`[${CONTROL_CHAR_START}-${CONTROL_CHAR_END}${DEL_CHAR}]`, "g");

const sanitizedText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((val) => val.replace(CONTROL_CHARS, ""));

export const TransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().finite().positive().max(1_000_000_000),
  category: z.enum(CATEGORIES),
  description: sanitizedText(280),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format." }),
});

export const BudgetSchema = z.object({
  category: z.enum(CATEGORIES),
  monthlyLimit: z.coerce.number().finite().nonnegative().max(1_000_000_000),
});

export const GoalSchema = z.object({
  name: sanitizedText(120),
  targetAmount: z.coerce.number().finite().positive().max(1_000_000_000),
  currentAmount: z.coerce.number().finite().nonnegative().max(1_000_000_000),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type GoalInput = z.infer<typeof GoalSchema>;
