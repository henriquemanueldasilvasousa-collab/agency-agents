import "server-only";
import { getDb } from "../store";
import type { Transaction } from "../types";
import type { TransactionInput } from "../validation";
import { ForbiddenError, NotFoundError } from "./errors";

export function listTransactions(userId: string): Transaction[] {
  return getDb()
    .transactions.filter((t) => t.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getTransaction(userId: string, id: string): Transaction {
  const tx = getDb().transactions.find((t) => t.id === id);
  if (!tx) throw new NotFoundError("Transaction not found.");
  if (tx.userId !== userId) throw new ForbiddenError("You do not have access to this transaction.");
  return tx;
}

export function createTransaction(userId: string, input: TransactionInput): Transaction {
  const tx: Transaction = { id: `tx-${crypto.randomUUID()}`, userId, ...input };
  getDb().transactions.push(tx);
  return tx;
}

export function updateTransaction(userId: string, id: string, input: TransactionInput): Transaction {
  const db = getDb();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) throw new NotFoundError("Transaction not found.");
  if (db.transactions[index].userId !== userId) throw new ForbiddenError("You do not have access to this transaction.");
  const updated: Transaction = { ...db.transactions[index], ...input };
  db.transactions[index] = updated;
  return updated;
}

export function deleteTransaction(userId: string, id: string): void {
  const db = getDb();
  const index = db.transactions.findIndex((t) => t.id === id);
  if (index === -1) throw new NotFoundError("Transaction not found.");
  if (db.transactions[index].userId !== userId) throw new ForbiddenError("You do not have access to this transaction.");
  db.transactions.splice(index, 1);
}
