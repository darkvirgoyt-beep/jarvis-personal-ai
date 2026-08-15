import { afterEach, describe, expect, it, vi } from "vitest";

const { eq, and, desc } = vi.hoisted(() => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  and: vi.fn((...conditions: unknown[]) => conditions),
  desc: vi.fn((value: unknown) => value),
}));

vi.mock("drizzle-orm", () => ({ eq, and, desc }));
vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn() }));

import {
  deleteJarvisMemory,
  resolveJarvisConfirmation,
  setJarvisDbForTests,
  updateJarvisMemory,
  updateJarvisTask,
} from "./db";

function fakeDb(affectedRows = 0) {
  const where = vi.fn(async () => [{ affectedRows }]);
  const update = vi.fn(() => ({ set: vi.fn(() => ({ where })) }));
  const remove = vi.fn(() => ({ where }));
  return { db: { update, delete: remove }, where, update, remove };
}

afterEach(() => {
  setJarvisDbForTests(null);
  vi.clearAllMocks();
});

describe("Jarvis private database scopes", () => {
  it("returns zero and includes the authenticated owner predicate for private updates and deletes", async () => {
    const { db } = fakeDb(0);
    setJarvisDbForTests(db as never);

    await expect(updateJarvisMemory(7, 99, "Private note", "note")).resolves.toBe(0);
    await expect(deleteJarvisMemory(7, 99)).resolves.toBe(0);
    await expect(updateJarvisTask({ userId: 7, id: 99, status: "done" })).resolves.toBe(0);
    await expect(resolveJarvisConfirmation(7, 99, "approved")).resolves.toBe(0);

    const ownerPredicates = eq.mock.calls.filter(([, value]) => value === 7);
    const recordPredicates = eq.mock.calls.filter(([, value]) => value === 99);
    expect(ownerPredicates).toHaveLength(4);
    expect(recordPredicates).toHaveLength(4);
    expect(and).toHaveBeenCalledTimes(4);
  });
});
