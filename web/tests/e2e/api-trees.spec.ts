import { expect, test, type APIRequestContext } from "@playwright/test";

type T = { id: number; slug: string; name: string; price: number; stock: number; size: string; species: string };
const list = async (request: APIRequestContext, qs = ""): Promise<T[]> => {
  const res = await request.get(`/api/trees${qs}`);
  expect(res.status()).toBe(200);
  return res.json();
};
const slugs = (ts: T[]) => ts.map((t) => t.slug).sort();

test.describe("GET /api/trees", () => {
  test("รูป array ตามข้อ 13.3 และไม่มีต้นที่ซ่อน", async ({ request }) => {
    const all = await list(request);
    expect(all).toHaveLength(20);
    for (const t of all) {
      expect(Object.keys(t).sort()).toEqual(["id", "name", "price", "size", "slug", "species", "stock"]);
    }
    expect(all.map((t) => t.slug)).not.toContain("hidden-test-tree");
  });

  test("กรองทีละตัว", async ({ request }) => {
    expect(slugs(await list(request, "?size=L"))).toEqual(["areca-palm", "fiddle-leaf-fig", "lime-tree", "mango-tree", "rubber-plant"]);
    expect(slugs(await list(request, "?species=HERB"))).toEqual(["holy-basil", "mint"]);
    expect(slugs(await list(request, "?care=HARD"))).toEqual(["mango-tree", "orchid"]);
    expect(slugs(await list(request, "?petSafe=1"))).toEqual(["areca-palm", "boston-fern", "holy-basil", "mango-tree", "mint", "orchid", "pachira"]);
    const lucky = await list(request, "?collection=lucky");
    expect(lucky.length).toBeGreaterThanOrEqual(5);
    expect(lucky.map((t) => t.slug)).toContain("zz-plant");
    expect(lucky.map((t) => t.slug)).not.toContain("monstera");
  });

  test("รวมเงื่อนไข = เฉพาะต้นที่ตรงทุกเงื่อนไข", async ({ request }) => {
    expect(slugs(await list(request, "?size=L&petSafe=1"))).toEqual(["areca-palm", "mango-tree"]);
    expect(slugs(await list(request, "?size=L&petSafe=1&care=HARD"))).toEqual(["mango-tree"]);
    expect(await list(request, "?size=S&species=FRUIT&care=HARD")).toEqual([]);
  });

  test("ค้นหาไทย/อังกฤษได้ต้นเดียวกัน ไม่แยกตัวพิมพ์ และตัดช่องว่าง", async ({ request }) => {
    for (const q of ["monstera", "MONSTERA", "%20monstera%20", "มอนสเตอร่า"]) {
      expect(slugs(await list(request, `?q=${q}`)), q).toEqual(["monstera"]);
    }
    expect(slugs(await list(request, "?q=monstera&locale=en"))).toEqual(["monstera"]);
    expect(await list(request, "?q=%20%20")).toHaveLength(20); // ว่าง = ไม่ค้น
  });

  test("เรียงลำดับ", async ({ request }) => {
    const asc = await list(request, "?sort=price_asc");
    expect(asc.map((t) => t.price)).toEqual([...asc.map((t) => t.price)].sort((a, b) => a - b));
    expect(asc[0].slug).toBe("holy-basil");
    const desc = await list(request, "?sort=price_desc");
    expect(desc.map((t) => t.price)).toEqual([...desc.map((t) => t.price)].sort((a, b) => b - a));
    expect(desc[0].slug).toBe("mango-tree");
    const newest = await list(request, "?sort=newest");
    expect(newest.map((t) => t.id)).toEqual([...newest.map((t) => t.id)].sort((a, b) => b - a));
  });

  test("ชื่อตามภาษา", async ({ request }) => {
    expect((await list(request, "?q=monstera&locale=en"))[0].name).toBe("Monstera");
    expect((await list(request, "?q=monstera&locale=th"))[0].name).toBe("มอนสเตอร่า");
  });

  test("หมวดที่ซ่อน/ว่าง/ไม่มี → []", async ({ request }) => {
    for (const c of ["archived", "empty", "nope"]) expect(await list(request, `?collection=${c}`), c).toEqual([]);
  });

  test("ค่าไม่ถูกต้อง → 400 VALIDATION_ERROR", async ({ request }) => {
    for (const qs of ["?size=XL", "?species=TREE", "?care=x", "?sort=bad", "?locale=fr"]) {
      const res = await request.get(`/api/trees${qs}`);
      expect(res.status(), qs).toBe(400);
      expect((await res.json()).error).toBe("VALIDATION_ERROR");
    }
  });
});
