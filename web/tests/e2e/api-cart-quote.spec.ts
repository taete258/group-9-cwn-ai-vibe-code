import { expect, test, type APIRequestContext } from "@playwright/test";

const idOf = async (request: APIRequestContext, slug: string) => (await (await request.get(`/api/trees/${slug}`)).json()).id as number;

test.describe("POST /api/cart/quote", () => {
  test("คำนวณจากราคาใน DB ไม่เชื่อ client และตรงสูตรข้อ 4", async ({ request }) => {
    const id = await idOf(request, "monstera"); // ฿1,290 → ส่งฟรี
    const res = await request.post("/api/cart/quote", { data: { items: [{ treeId: id, quantity: 1 }] } });
    expect(res.status()).toBe(200);
    const q = await res.json();
    expect(q.lines).toEqual([{ treeId: id, slug: "monstera", unitPrice: 129000, quantity: 1, amount: 129000 }]);
    expect(q).toMatchObject({ subtotal: 129000, shippingFee: 0, total: 129000, vat: 8439, net: 120561, freeShippingRemaining: 0, warnings: [] });
  });

  test("ราคาที่ client ส่งมาถูกเมินและยอดเท่ากันทั้งสองภาษา", async ({ request }) => {
    const id = await idOf(request, "monstera");
    const body = { items: [{ treeId: id, quantity: 1, unitPrice: 1, price: 1 }] };
    const th = await (await request.post("/api/cart/quote?locale=th", { data: body })).json();
    const en = await (await request.post("/api/cart/quote?locale=en", { data: body })).json();
    expect(th.lines[0].unitPrice).toBe(129000);
    expect(en).toEqual(th);
  });

  test("เตือนเมื่อเกิน stock / สินค้าหมด", async ({ request }) => {
    const monstera = await idOf(request, "monstera");
    const fig = await idOf(request, "fiddle-leaf-fig");
    const q = await (await request.post("/api/cart/quote", { data: { items: [{ treeId: monstera, quantity: 99 }, { treeId: fig, quantity: 1 }] } })).json();
    expect(q.warnings).toEqual([
      { treeId: monstera, code: "INSUFFICIENT_STOCK", available: 5 },
      { treeId: fig, code: "OUT_OF_STOCK" },
    ]);
  });

  test("รายการซ้ำรวมจำนวนเป็นบรรทัดเดียว", async ({ request }) => {
    const id = await idOf(request, "monstera");
    const q = await (await request.post("/api/cart/quote", { data: { items: [{ treeId: id, quantity: 1 }, { treeId: id, quantity: 2 }] } })).json();
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0].quantity).toBe(3);
  });

  for (const [name, body] of [
    ["items ว่าง", { items: [] }],
    ["quantity 0", { items: [{ treeId: 1, quantity: 0 }] }],
    ["quantity ทศนิยม", { items: [{ treeId: 1, quantity: 1.5 }] }],
    ["ไม่มี items", {}],
  ] as const) {
    test(`400 VALIDATION_ERROR: ${name}`, async ({ request }) => {
      const res = await request.post("/api/cart/quote", { data: body });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBe("VALIDATION_ERROR");
    });
  }

  test("400 เมื่อ body ไม่ใช่ JSON", async ({ request }) => {
    const res = await request.post("/api/cart/quote", { headers: { "content-type": "application/json" }, data: "{oops" });
    expect(res.status()).toBe(400);
  });

  test("404 NOT_FOUND: ไม่มี id / ต้นที่ซ่อน", async ({ request }) => {
    for (const treeId of [999999]) {
      const res = await request.post("/api/cart/quote", { data: { items: [{ treeId, quantity: 1 }] } });
      expect(res.status()).toBe(404);
      expect((await res.json()).error).toBe("NOT_FOUND");
    }
  });
});
