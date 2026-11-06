import { expect, test } from "@playwright/test";

test.describe("GET /api/home", () => {
  test("รูปตามสัญญา: rows[{type,key,trees}] ภาษาอังกฤษ ไม่มีต้นที่ซ่อนและไม่มีแถวว่าง", async ({ request }) => {
    const res = await request.get("/api/home?locale=en");
    expect(res.status()).toBe(200);
    const { rows } = await res.json();

    expect(rows.slice(0, 3).map((r: { key: string }) => r.key)).toEqual(["lucky", "decor", "edible"]);
    expect(rows[0]).toMatchObject({ type: "collection", name: "Lucky charms" });
    for (const row of rows) {
      expect(["collection", "size", "species"]).toContain(row.type);
      expect(row.trees.length).toBeGreaterThan(0);
      for (const t of row.trees) {
        expect(t).toMatchObject({ id: expect.any(Number), slug: expect.any(String), name: expect.any(String), price: expect.any(Number), stock: expect.any(Number) });
        expect(t.slug).not.toBe("hidden-test-tree");
      }
    }
    const keys = rows.map((r: { key: string }) => r.key);
    expect(keys).not.toContain("archived");
    expect(keys).not.toContain("empty");
    expect(rows.find((r: { key: string }) => r.key === "decor").trees.find((t: { slug: string }) => t.slug === "monstera").name).toBe("Monstera");
  });

  test("locale ที่ไม่รู้จัก → 400 VALIDATION_ERROR", async ({ request }) => {
    const res = await request.get("/api/home?locale=fr");
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("VALIDATION_ERROR");
  });
});
