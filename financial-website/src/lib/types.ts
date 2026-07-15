export const CATEGORIES = [
  "Income",
  "Housing",
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Health",
  "Shopping",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TransactionType = "income" | "expense";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO date (yyyy-mm-dd)
}

export interface Budget {
  id: string;
  userId: string;
  category: Category;
  monthlyLimit: number;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date
}
