import { describe, expect, it } from "vitest";
import { BudgetSchema, GoalSchema, LoginSchema, PasswordSchema, SignupSchema, TransactionSchema } from "@/lib/validation";

describe("PasswordSchema", () => {
  it("accepts a strong password", () => {
    expect(PasswordSchema.safeParse("Password123!").success).toBe(true);
  });

  it("rejects passwords under 8 characters", () => {
    expect(PasswordSchema.safeParse("P1!aaa").success).toBe(false);
  });

  it("rejects passwords without a number", () => {
    expect(PasswordSchema.safeParse("Password!!!").success).toBe(false);
  });

  it("rejects passwords without a special character", () => {
    expect(PasswordSchema.safeParse("Password123").success).toBe(false);
  });

  it("rejects passwords without a letter", () => {
    expect(PasswordSchema.safeParse("12345678!").success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("normalizes email to lowercase and trims whitespace", () => {
    const result = LoginSchema.safeParse({ email: "  Demo@Example.COM  ", password: "anything" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("demo@example.com");
    }
  });

  it("rejects an invalid email", () => {
    expect(LoginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(LoginSchema.safeParse({ email: "demo@example.com", password: "" }).success).toBe(false);
  });
});

describe("SignupSchema", () => {
  it("accepts valid signup input", () => {
    const result = SignupSchema.safeParse({ name: "Demo User", email: "demo@example.com", password: "Password123!" });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(SignupSchema.safeParse({ name: "D", email: "demo@example.com", password: "Password123!" }).success).toBe(false);
  });

  it("rejects a weak password", () => {
    expect(SignupSchema.safeParse({ name: "Demo User", email: "demo@example.com", password: "weak" }).success).toBe(false);
  });
});

describe("TransactionSchema", () => {
  it("accepts a valid expense", () => {
    const result = TransactionSchema.safeParse({
      type: "expense",
      amount: "42.50",
      category: "Food",
      description: "Groceries",
      date: "2026-07-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(42.5);
    }
  });

  it("rejects a negative amount", () => {
    expect(
      TransactionSchema.safeParse({ type: "expense", amount: -5, category: "Food", description: "x", date: "2026-07-01" })
        .success
    ).toBe(false);
  });

  it("rejects an invalid category", () => {
    expect(
      TransactionSchema.safeParse({
        type: "expense",
        amount: 5,
        category: "NotACategory",
        description: "x",
        date: "2026-07-01",
      }).success
    ).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(
      TransactionSchema.safeParse({ type: "expense", amount: 5, category: "Food", description: "x", date: "07/01/2026" })
        .success
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      TransactionSchema.safeParse({ type: "expense", amount: 5, category: "Food", description: "   ", date: "2026-07-01" })
        .success
    ).toBe(false);
  });

  it("strips control characters from the description", () => {
    const withControlChars = `Rent${String.fromCharCode(0)}${String.fromCharCode(7)}`;
    const result = TransactionSchema.safeParse({
      type: "expense",
      amount: 5,
      category: "Housing",
      description: withControlChars,
      date: "2026-07-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Rent");
    }
  });

  it("preserves HTML-like text verbatim (escaping is a render-time concern)", () => {
    const result = TransactionSchema.safeParse({
      type: "expense",
      amount: 5,
      category: "Other",
      description: "<script>alert(1)</script>",
      date: "2026-07-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("<script>alert(1)</script>");
    }
  });

  it("rejects an unreasonably large amount", () => {
    expect(
      TransactionSchema.safeParse({
        type: "expense",
        amount: 1_000_000_001,
        category: "Other",
        description: "x",
        date: "2026-07-01",
      }).success
    ).toBe(false);
  });
});

describe("BudgetSchema", () => {
  it("accepts a zero monthly limit", () => {
    expect(BudgetSchema.safeParse({ category: "Food", monthlyLimit: 0 }).success).toBe(true);
  });

  it("rejects a negative monthly limit", () => {
    expect(BudgetSchema.safeParse({ category: "Food", monthlyLimit: -1 }).success).toBe(false);
  });
});

describe("GoalSchema", () => {
  it("accepts a valid goal", () => {
    const result = GoalSchema.safeParse({
      name: "Emergency fund",
      targetAmount: 1000,
      currentAmount: 100,
      targetDate: "2027-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive target amount", () => {
    expect(
      GoalSchema.safeParse({ name: "Goal", targetAmount: 0, currentAmount: 0, targetDate: "2027-01-01" }).success
    ).toBe(false);
  });
});
