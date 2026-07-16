import "server-only";
import bcrypt from "bcryptjs";
import type { Budget, Goal, Transaction, User } from "./types";

interface Database {
  users: User[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

// In-memory store seeded with mock data only. Nothing here represents real
// accounts, real money, or real PII — this is a demo/portfolio project.
function seed(): Database {
  const demoHash = bcrypt.hashSync("Password123!", 10);

  const users: User[] = [
    {
      id: "user-demo",
      name: "Demo User",
      email: "demo@example.com",
      passwordHash: demoHash,
    },
    {
      id: "user-alice",
      name: "Alice Anderson",
      email: "alice@example.com",
      passwordHash: demoHash,
    },
  ];

  const today = new Date();
  const iso = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  const transactions: Transaction[] = [
    { id: "tx-1", userId: "user-demo", type: "income", amount: 4200, category: "Income", description: "Monthly salary", date: iso(2) },
    { id: "tx-2", userId: "user-demo", type: "expense", amount: 1200, category: "Housing", description: "Rent", date: iso(2) },
    { id: "tx-3", userId: "user-demo", type: "expense", amount: 320.5, category: "Food", description: "Groceries", date: iso(5) },
    { id: "tx-4", userId: "user-demo", type: "expense", amount: 89.99, category: "Entertainment", description: "Streaming + concert", date: iso(8) },
    { id: "tx-5", userId: "user-demo", type: "expense", amount: 150, category: "Transport", description: "Fuel and transit pass", date: iso(10) },
    { id: "tx-6", userId: "user-demo", type: "expense", amount: 60, category: "Utilities", description: "Electricity bill", date: iso(12) },
    { id: "tx-7", userId: "user-demo", type: "expense", amount: 45.25, category: "Health", description: "Pharmacy", date: iso(15) },
    { id: "tx-8", userId: "user-demo", type: "expense", amount: 210, category: "Shopping", description: "New shoes", date: iso(20) },
    { id: "tx-9", userId: "user-alice", type: "income", amount: 3800, category: "Income", description: "Freelance payment", date: iso(3) },
    { id: "tx-10", userId: "user-alice", type: "expense", amount: 950, category: "Housing", description: "Rent", date: iso(3) },
  ];

  const budgets: Budget[] = [
    { id: "bg-1", userId: "user-demo", category: "Food", monthlyLimit: 400 },
    { id: "bg-2", userId: "user-demo", category: "Entertainment", monthlyLimit: 100 },
    { id: "bg-3", userId: "user-demo", category: "Transport", monthlyLimit: 200 },
    { id: "bg-4", userId: "user-demo", category: "Shopping", monthlyLimit: 150 },
    { id: "bg-5", userId: "user-alice", category: "Housing", monthlyLimit: 1000 },
  ];

  const goals: Goal[] = [
    { id: "gl-1", userId: "user-demo", name: "Emergency fund", targetAmount: 10000, currentAmount: 4200, targetDate: "2026-12-31" },
    { id: "gl-2", userId: "user-demo", name: "Vacation to Japan", targetAmount: 3500, currentAmount: 900, targetDate: "2027-04-01" },
    { id: "gl-3", userId: "user-alice", name: "New laptop", targetAmount: 2000, currentAmount: 500, targetDate: "2026-10-01" },
  ];

  return { users, transactions, budgets, goals };
}

const globalForDb = globalThis as unknown as { __financialDb?: Database };

export function getDb(): Database {
  if (!globalForDb.__financialDb) {
    globalForDb.__financialDb = seed();
  }
  return globalForDb.__financialDb;
}

/** Test-only helper to reset the in-memory store to its seeded state. */
export function resetDb(): void {
  globalForDb.__financialDb = seed();
}
