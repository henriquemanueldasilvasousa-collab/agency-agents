import "server-only";
import { getDb } from "../store";
import type { Goal } from "../types";
import type { GoalInput } from "../validation";
import { ForbiddenError, NotFoundError } from "./errors";

export function listGoals(userId: string): Goal[] {
  return getDb().goals.filter((g) => g.userId === userId);
}

export function createGoal(userId: string, input: GoalInput): Goal {
  const goal: Goal = { id: `gl-${crypto.randomUUID()}`, userId, ...input };
  getDb().goals.push(goal);
  return goal;
}

export function updateGoal(userId: string, id: string, input: GoalInput): Goal {
  const db = getDb();
  const index = db.goals.findIndex((g) => g.id === id);
  if (index === -1) throw new NotFoundError("Goal not found.");
  if (db.goals[index].userId !== userId) throw new ForbiddenError("You do not have access to this goal.");
  const updated: Goal = { ...db.goals[index], ...input };
  db.goals[index] = updated;
  return updated;
}

export function deleteGoal(userId: string, id: string): void {
  const db = getDb();
  const index = db.goals.findIndex((g) => g.id === id);
  if (index === -1) throw new NotFoundError("Goal not found.");
  if (db.goals[index].userId !== userId) throw new ForbiddenError("You do not have access to this goal.");
  db.goals.splice(index, 1);
}
