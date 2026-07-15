import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { TestClient } from "./http";
import { SERVER_INFO_FILE } from "./global-setup";

let baseUrl: string;

beforeAll(() => {
  const info = JSON.parse(readFileSync(SERVER_INFO_FILE, "utf-8"));
  baseUrl = info.baseUrl;
});

function client() {
  return new TestClient(baseUrl);
}

describe("auth", () => {
  it("rejects login with wrong credentials", async () => {
    const c = client();
    const { status, body } = await c.post("/api/auth/login", { email: "demo@example.com", password: "WrongPass1!" });
    expect(status).toBe(401);
    expect(body.error).toBeTruthy();
  });

  it("logs in with correct seeded credentials", async () => {
    const c = client();
    const { status, body } = await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });
    expect(status).toBe(200);
    expect(body.user.email).toBe("demo@example.com");
  });

  it("rejects malformed login payloads with 400", async () => {
    const c = client();
    const { status } = await c.post("/api/auth/login", { email: "not-an-email", password: "" });
    expect(status).toBe(400);
  });

  it("signs up a new user, rejects duplicate email, and rejects weak passwords", async () => {
    const c = client();
    const email = `newuser-${Date.now()}@example.com`;

    const weak = await c.post("/api/auth/signup", { name: "Weak", email, password: "weak" });
    expect(weak.status).toBe(400);

    const created = await c.post("/api/auth/signup", { name: "New User", email, password: "StrongPass1!" });
    expect(created.status).toBe(201);
    expect(created.body.user.email).toBe(email);

    const dup = await c.post("/api/auth/signup", { name: "New User", email, password: "StrongPass1!" });
    expect(dup.status).toBe(409);
  });

  it("returns the current user from /api/auth/me after login, 401 before", async () => {
    const c = client();
    const before = await c.get("/api/auth/me");
    expect(before.status).toBe(401);

    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });
    const after = await c.get("/api/auth/me");
    expect(after.status).toBe(200);
    expect(after.body.user.email).toBe("demo@example.com");
  });

  it("clears the session on logout", async () => {
    const c = client();
    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });
    expect((await c.get("/api/auth/me")).status).toBe(200);

    const logout = await c.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect((await c.get("/api/auth/me")).status).toBe(401);
  });

  it("rate-limits repeated failed login attempts", async () => {
    const c = client();
    const email = `ratelimit-${Date.now()}@example.com`;
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await c.post("/api/auth/login", { email, password: "WrongPass1!" });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe("CSRF / same-origin protection", () => {
  it("rejects mutating requests with a cross-site Origin header", async () => {
    const c = client();
    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const res = await c.post(
      "/api/transactions",
      { type: "expense", amount: 5, category: "Food", description: "csrf-test", date: "2026-07-01" },
      { origin: "https://evil.example.com" }
    );
    expect(res.status).toBe(403);
  });

  it("rejects mutating requests with no Origin header", async () => {
    const c = client();
    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const res = await c.post(
      "/api/transactions",
      { type: "expense", amount: 5, category: "Food", description: "csrf-test-2", date: "2026-07-01" },
      { origin: null }
    );
    expect(res.status).toBe(403);
  });
});

describe("transactions", () => {
  it("requires authentication", async () => {
    const c = client();
    expect((await c.get("/api/transactions")).status).toBe(401);
    expect(
      (
        await c.post("/api/transactions", {
          type: "expense",
          amount: 1,
          category: "Food",
          description: "x",
          date: "2026-07-01",
        })
      ).status
    ).toBe(401);
  });

  it("supports create, list, update, and delete for the owning user", async () => {
    const c = client();
    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const created = await c.post("/api/transactions", {
      type: "expense",
      amount: 25.5,
      category: "Food",
      description: "Functional test lunch",
      date: "2026-07-02",
    });
    expect(created.status).toBe(201);
    const id = created.body.transaction.id;

    const list = await c.get("/api/transactions");
    expect(list.status).toBe(200);
    expect(list.body.transactions.some((t: any) => t.id === id)).toBe(true);

    const updated = await c.put(`/api/transactions/${id}`, {
      type: "expense",
      amount: 30,
      category: "Food",
      description: "Updated lunch",
      date: "2026-07-02",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.transaction.amount).toBe(30);

    const deleted = await c.delete(`/api/transactions/${id}`);
    expect(deleted.status).toBe(200);

    const getAfterDelete = await c.get(`/api/transactions/${id}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("rejects invalid transaction payloads with 400", async () => {
    const c = client();
    await c.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const negative = await c.post("/api/transactions", {
      type: "expense",
      amount: -10,
      category: "Food",
      description: "bad",
      date: "2026-07-01",
    });
    expect(negative.status).toBe(400);

    const badCategory = await c.post("/api/transactions", {
      type: "expense",
      amount: 10,
      category: "NotACategory",
      description: "bad",
      date: "2026-07-01",
    });
    expect(badCategory.status).toBe(400);

    const badDate = await c.post("/api/transactions", {
      type: "expense",
      amount: 10,
      category: "Food",
      description: "bad",
      date: "not-a-date",
    });
    expect(badDate.status).toBe(400);
  });

  it("prevents one user from reading, updating, or deleting another user's transaction (IDOR)", async () => {
    const demo = client();
    await demo.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });
    const created = await demo.post("/api/transactions", {
      type: "expense",
      amount: 12,
      category: "Food",
      description: "Owned by demo",
      date: "2026-07-03",
    });
    const id = created.body.transaction.id;

    const alice = client();
    await alice.post("/api/auth/login", { email: "alice@example.com", password: "Password123!" });

    expect((await alice.get(`/api/transactions/${id}`)).status).toBe(403);
    expect(
      (
        await alice.put(`/api/transactions/${id}`, {
          type: "expense",
          amount: 999,
          category: "Food",
          description: "hijacked",
          date: "2026-07-03",
        })
      ).status
    ).toBe(403);
    expect((await alice.delete(`/api/transactions/${id}`)).status).toBe(403);

    // Confirm demo's transaction is untouched.
    const stillThere = await demo.get(`/api/transactions/${id}`);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.transaction.description).toBe("Owned by demo");
  });
});

describe("budgets", () => {
  it("creates and upserts a budget by category, and enforces ownership on delete", async () => {
    const demo = client();
    await demo.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const created = await demo.post("/api/budgets", { category: "Entertainment", monthlyLimit: 80 });
    expect(created.status).toBe(201);

    const upserted = await demo.post("/api/budgets", { category: "Entertainment", monthlyLimit: 120 });
    expect(upserted.status).toBe(201);
    expect(upserted.body.budget.monthlyLimit).toBe(120);
    expect(upserted.body.budget.id).toBe(created.body.budget.id);

    const alice = client();
    await alice.post("/api/auth/login", { email: "alice@example.com", password: "Password123!" });
    expect((await alice.delete(`/api/budgets/${created.body.budget.id}`)).status).toBe(403);

    expect((await demo.delete(`/api/budgets/${created.body.budget.id}`)).status).toBe(200);
  });
});

describe("goals", () => {
  it("creates a goal and enforces ownership on update", async () => {
    const demo = client();
    await demo.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });

    const created = await demo.post("/api/goals", {
      name: "Functional test goal",
      targetAmount: 500,
      currentAmount: 50,
      targetDate: "2027-01-01",
    });
    expect(created.status).toBe(201);

    const alice = client();
    await alice.post("/api/auth/login", { email: "alice@example.com", password: "Password123!" });
    const hijack = await alice.put(`/api/goals/${created.body.goal.id}`, {
      name: "Hijacked",
      targetAmount: 1,
      currentAmount: 1,
      targetDate: "2027-01-01",
    });
    expect(hijack.status).toBe(403);
  });
});

describe("dashboard summary", () => {
  it("requires authentication and returns aggregated data for the authenticated user", async () => {
    const anon = client();
    expect((await anon.get("/api/summary")).status).toBe(401);

    const demo = client();
    await demo.post("/api/auth/login", { email: "demo@example.com", password: "Password123!" });
    const summary = await demo.get("/api/summary");
    expect(summary.status).toBe(200);
    expect(typeof summary.body.balance).toBe("number");
    expect(Array.isArray(summary.body.budgets)).toBe(true);
    expect(Array.isArray(summary.body.goals)).toBe(true);
  });
});

describe("security headers", () => {
  it("sets CSP and other hardening headers on page responses", async () => {
    const res = await fetch(`${baseUrl}/login`);
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBeTruthy();
    expect(res.headers.get("x-powered-by")).toBeNull();
  });

  it("redirects unauthenticated requests away from protected pages", async () => {
    const res = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
    expect([301, 302, 307, 308]).toContain(res.status);
    expect(res.headers.get("location")).toContain("/login");
  });
});
