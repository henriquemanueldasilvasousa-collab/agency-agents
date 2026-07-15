import { describe, expect, it } from "vitest";
import {
  balance,
  budgetStatus,
  formatCurrency,
  goalProgress,
  isSameMonth,
  round2,
  spentByCategoryThisMonth,
  totalExpenses,
  totalIncome,
} from "@/lib/calculations";
import type { Budget, Goal, Transaction } from "@/lib/types";

const reference = new Date("2026-07-15T00:00:00Z");

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "tx-test",
    userId: "user-1",
    type: "expense",
    amount: 100,
    category: "Food",
    description: "test",
    date: "2026-07-10",
    ...overrides,
  };
}

describe("round2", () => {
  it("rounds to two decimal places", () => {
    expect(round2(1.005)).toBeCloseTo(1.01, 2);
    expect(round2(19.999)).toBe(20);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("formatCurrency", () => {
  it("formats as USD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("supports other currencies", () => {
    expect(formatCurrency(10, "EUR")).toContain("10");
  });
});

describe("totalIncome / totalExpenses / balance", () => {
  const transactions: Transaction[] = [
    tx({ id: "1", type: "income", amount: 1000 }),
    tx({ id: "2", type: "expense", amount: 400 }),
    tx({ id: "3", type: "expense", amount: 100.5 }),
  ];

  it("sums income only", () => {
    expect(totalIncome(transactions)).toBe(1000);
  });

  it("sums expenses only", () => {
    expect(totalExpenses(transactions)).toBe(500.5);
  });

  it("computes balance as income minus expenses", () => {
    expect(balance(transactions)).toBe(499.5);
  });

  it("returns zero for an empty transaction list", () => {
    expect(balance([])).toBe(0);
    expect(totalIncome([])).toBe(0);
    expect(totalExpenses([])).toBe(0);
  });
});

describe("isSameMonth", () => {
  it("returns true for a date in the same UTC month as the reference", () => {
    expect(isSameMonth("2026-07-01", reference)).toBe(true);
    expect(isSameMonth("2026-07-31", reference)).toBe(true);
  });

  it("returns false for a date in a different month", () => {
    expect(isSameMonth("2026-06-30", reference)).toBe(false);
    expect(isSameMonth("2026-08-01", reference)).toBe(false);
  });
});

describe("spentByCategoryThisMonth", () => {
  const transactions: Transaction[] = [
    tx({ id: "1", category: "Food", amount: 50, date: "2026-07-05" }),
    tx({ id: "2", category: "Food", amount: 30, date: "2026-07-20" }),
    tx({ id: "3", category: "Food", amount: 999, date: "2026-06-20" }),
    tx({ id: "4", category: "Transport", amount: 20, date: "2026-07-05" }),
    tx({ id: "5", category: "Food", amount: 1000, type: "income", date: "2026-07-05" }),
  ];

  it("sums only expenses in the given category within the reference month", () => {
    expect(spentByCategoryThisMonth(transactions, "Food", reference)).toBe(80);
  });

  it("ignores income transactions even if in the same category", () => {
    expect(spentByCategoryThisMonth(transactions, "Food", reference)).not.toBe(1080);
  });
});

describe("budgetStatus", () => {
  const budget: Budget = { id: "b1", userId: "user-1", category: "Food", monthlyLimit: 100 };

  it("reports remaining budget and percent used when under budget", () => {
    const transactions = [tx({ amount: 40, date: "2026-07-05" })];
    const status = budgetStatus(budget, transactions, reference);
    expect(status.spent).toBe(40);
    expect(status.remaining).toBe(60);
    expect(status.percentUsed).toBe(40);
    expect(status.isOverBudget).toBe(false);
  });

  it("flags over-budget when spend exceeds the limit", () => {
    const transactions = [tx({ amount: 150, date: "2026-07-05" })];
    const status = budgetStatus(budget, transactions, reference);
    expect(status.isOverBudget).toBe(true);
    expect(status.remaining).toBe(-50);
    expect(status.percentUsed).toBe(150);
  });

  it("does not divide by zero when the limit is zero", () => {
    const zeroBudget: Budget = { ...budget, monthlyLimit: 0 };
    const status = budgetStatus(zeroBudget, [], reference);
    expect(status.percentUsed).toBe(0);
    expect(Number.isFinite(status.percentUsed)).toBe(true);
  });
});

describe("goalProgress", () => {
  it("computes percent complete and remaining amount", () => {
    const goal: Goal = {
      id: "g1",
      userId: "user-1",
      name: "Trip",
      targetAmount: 1000,
      currentAmount: 250,
      targetDate: "2026-12-31",
    };
    const progress = goalProgress(goal);
    expect(progress.percentComplete).toBe(25);
    expect(progress.amountRemaining).toBe(750);
    expect(progress.isComplete).toBe(false);
  });

  it("caps percent complete at 100 even if overfunded", () => {
    const goal: Goal = {
      id: "g2",
      userId: "user-1",
      name: "Overfunded",
      targetAmount: 100,
      currentAmount: 500,
      targetDate: "2026-12-31",
    };
    const progress = goalProgress(goal);
    expect(progress.percentComplete).toBe(100);
    expect(progress.amountRemaining).toBe(0);
    expect(progress.isComplete).toBe(true);
  });

  it("handles a zero target amount without dividing by zero", () => {
    const goal: Goal = { id: "g3", userId: "user-1", name: "Zero", targetAmount: 0, currentAmount: 0, targetDate: "2026-12-31" };
    const progress = goalProgress(goal);
    expect(Number.isFinite(progress.percentComplete)).toBe(true);
  });
});
