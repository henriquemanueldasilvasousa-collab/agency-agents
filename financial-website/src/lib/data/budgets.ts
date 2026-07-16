import "server-only";
import { getDb } from "../store";
import type { Budget } from "../types";
import type { BudgetInput } from "../validation";
import { ForbiddenError, NotFoundError } from "./errors";

export function listBudgets(userId: string): Budget[] {
  return getDb().budgets.filter((b) => b.userId === userId);
}

export function createBudget(userId: string, input: BudgetInput): Budget {
  const db = getDb();
  const existing = db.budgets.find((b) => b.userId === userId && b.category === input.category);
  if (existing) {
    const updated: Budget = { ...existing, monthlyLimit: input.monthlyLimit };
    const index = db.budgets.findIndex((b) => b.id === existing.id);
    db.budgets[index] = updated;
    return updated;
  }
  const budget: Budget = { id: `bg-${crypto.randomUUID()}`, userId, ...input };
  db.budgets.push(budget);
  return budget;
}

export function updateBudget(userId: string, id: string, input: BudgetInput): Budget {
  const db = getDb();
  const index = db.budgets.findIndex((b) => b.id === id);
  if (index === -1) throw new NotFoundError("Budget not found.");
  if (db.budgets[index].userId !== userId) throw new ForbiddenError("You do not have access to this budget.");
  const updated: Budget = { ...db.budgets[index], ...input };
  db.budgets[index] = updated;
  return updated;
}

export function deleteBudget(userId: string, id: string): void {
  const db = getDb();
  const index = db.budgets.findIndex((b) => b.id === id);
  if (index === -1) throw new NotFoundError("Budget not found.");
  if (db.budgets[index].userId !== userId) throw new ForbiddenError("You do not have access to this budget.");
  db.budgets.splice(index, 1);
}
