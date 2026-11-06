import { expect, test } from "@playwright/test";

test.describe("GET /api/trees/[slug]", () => {
  test("200 ฟิลด์ตามสัญญา", async ({ request }) => {
    const res = await request.get("/api/trees/monstera?locale=th");
    expect(res.status()).toBe(200);
    const t = await res.json();
    expect(t).toMatchObject({
      id: 1, slug: "monstera", name: "มอนสเตอร่า", description: expect.any(String),
      price: 129000, stock: 5, size: "M", species: "FOLIAGE", careLevel: "EASY",
      light: expect.any(String), water: expect.any(String), heightCm: 60, potSizeInch: 8, petSafe: false,
      images: ["/trees/monstera-1.jpg", "/trees/monstera-2.jpg", "/trees/monstera-3.jpg"],
    });
    expect(t).toMatchObject({
      nameTh: "มอนสเตอร่า", nameEn: "Monstera", scientificName: "Monstera deliciosa", origin: expect.stringContaining("อเมริกากลาง"),
    });
    expect(t.description.length).toBeGreaterThan(300);
    expect(t.fengShui[0]).toEqual({ room: "LIVING", direction: "SE", benefit: "WEALTH", reason: expect.any(String) });
    expect(t.related).toHaveLength(4);
    for (const r of t.related) {
      expect(Object.keys(r).sort()).toEqual(["id", "name", "price", "size", "slug", "species", "stock"]);
      expect(r.slug).not.toBe("monstera");
    }
  });

  test("ค่าว่างได้: potSizeInch null, fengShui []", async ({ request }) => {
    const bamboo = await (await request.get("/api/trees/lucky-bamboo")).json();
    expect(bamboo.potSizeInch).toBeNull();
    const aloe = await (await request.get("/api/trees/aloe-vera?locale=en")).json();
    expect(aloe.fengShui).toEqual([]);
    expect(aloe.name).toBe("Aloe vera");
  });

  for (const slug of ["no-such-tree", "hidden-test-tree"]) {
    test(`${slug} → 404 NOT_FOUND`, async ({ request }) => {
      const res = await request.get(`/api/trees/${slug}`);
      expect(res.status()).toBe(404);
      expect((await res.json()).error).toBe("NOT_FOUND");
    });
  }

  test("locale ที่ไม่รู้จัก → 400 VALIDATION_ERROR", async ({ request }) => {
    const res = await request.get("/api/trees/monstera?locale=fr");
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("VALIDATION_ERROR");
  });
});
