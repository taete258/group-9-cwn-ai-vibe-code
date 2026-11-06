import { expect, type Page } from "@playwright/test";
import { baht, cartItem, hl, idOf, oracle, T, tc } from "./helpers";

const seedCart = async (page: Page, items: unknown[]) => {
  await page.goto("/th/cart");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await page.evaluate((v) => localStorage.setItem("tree-shop-cart", JSON.stringify(v)), items);
  await page.reload();
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
};
const quote = (request: import("@playwright/test").APIRequestContext, items: { treeId: number; quantity: number }[]) =>
  request.post("/api/cart/quote", { data: { items } });

tc("TC-CART-01", "ตัวอย่างในสเปก: ตะกร้า ฿890 → ค่าส่ง 60 ยอดสุทธิ 950 ก่อน VAT 887.85 VAT 62.15", { level: "P1", section: "5.4", expected: "subtotal ฿890.00 · ค่าส่ง ฿60.00 · total ฿950.00 · net ฿887.85 · VAT ฿62.15 · 'ซื้อเพิ่มอีก ฿110.00'", source: "[D] spec ข้อ 4 ตารางตัวอย่าง (฿890 + ส่ง ฿60 = ฿950; VAT = round(95000×7/107) = 6215)" }, async ({ page }) => {
  await page.goto("/th/trees/pachira");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า) // ฿890.00
  await page.getByTestId("add-to-cart").click();
  await page.goto("/th/cart");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(await hl(page.getByTestId("cart-subtotal"))).toHaveText("฿890.00");
  await expect.soft(page.getByTestId("cart-shipping")).toHaveText("฿60.00");
  await expect.soft(page.getByTestId("cart-total")).toHaveText("฿950.00");
  await expect.soft(page.getByTestId("cart-net")).toHaveText("฿887.85");
  await expect.soft(page.getByTestId("cart-vat")).toHaveText("฿62.15");
  await expect.soft(page.getByTestId("free-shipping-remaining")).toContainText("฿110.00");
});

const boundary: [string, [keyof typeof T, number][], string][] = [
  ["TC-CART-02", [["zz-plant", 2], ["holy-basil", 1]], "฿990 (450×2 + 90) → ยังคิดค่าส่ง 60"],
  ["TC-CART-03", [["syngonium", 1], ["lucky-bamboo", 1], ["peace-lily", 1]], "฿1,000 (320+190+490) → ส่งฟรี (>=)"],
  ["TC-CART-04", [["pachira", 1], ["mint", 1]], "฿1,010 (890+120) → ส่งฟรี"],
];
for (const [id, lines, label] of boundary) {
  tc(id, `ขอบเขตค่าส่ง ${label}`, { level: "P1", section: "5.4", expected: `ยอดทุกช่องตรง oracle ที่คิดเองจาก spec ข้อ 4: ${label}`, source: "[D] spec ข้อ 4: ส่งฟรีเมื่อ subtotal >= ฿1,000 · ราคา [D] seed" }, async ({ request }) => {
    const items = await Promise.all(lines.map(async ([slug, quantity]) => ({ treeId: await idOf(request, slug), quantity })));
    const subtotal = lines.reduce((s, [slug, q]) => s + T[slug].price * q, 0);
    const q = await (await quote(request, items)).json();
    expect(q).toMatchObject(oracle(subtotal));
  });
}

tc("TC-CART-05", "คิด VAT/net ตรง oracle ในตะกร้าหลายแบบ (ปัดครั้งเดียวที่ยอดสุทธิ)", { level: "P1", section: "5.4", expected: "6 ตะกร้า: vat = round(total×7/107), net = total − vat, total = subtotal + ค่าส่ง ตรงทุกสตางค์", source: "[D] spec ข้อ 4 + 13.4 (oracle เขียนแยก)" }, async ({ request }) => {
  const carts: [keyof typeof T, number][][] = [[["holy-basil", 1]], [["mint", 3]], [["monstera", 1]], [["tomato", 1], ["mango-tree", 2]], [["lucky-bamboo", 7]], [["zz-plant", 1], ["syngonium", 1], ["holy-basil", 1]]];
  for (const lines of carts) {
    const items = await Promise.all(lines.map(async ([slug, quantity]) => ({ treeId: await idOf(request, slug), quantity })));
    const subtotal = lines.reduce((s, [slug, q]) => s + T[slug].price * q, 0);
    const q = await (await quote(request, items)).json();
    expect.soft(q, JSON.stringify(lines)).toMatchObject(oracle(subtotal));
    expect.soft(q.total).toBe(q.subtotal + q.shippingFee);
    expect.soft(q.vat + q.net).toBe(q.total);
  }
});

tc("TC-CART-06", "แก้ราคาใน request ไม่มีผล (server คำนวณใหม่) และยอดเท่ากันทั้งสองภาษา", { level: "P1", section: "5.4", expected: "ส่ง unitPrice=1, price=1 แล้ว unitPrice ยัง 129000 · locale=th กับ en ได้ JSON เหมือนกัน", source: "[D] constitution ข้อ II / spec ข้อ 9 'ห้ามเชื่อตัวเลขจาก client' · seed monstera 129000" }, async ({ request }) => {
  const id = await idOf(request, "monstera");
  const body = { items: [{ treeId: id, quantity: 1, unitPrice: 1, price: 1, amount: 1 }], total: 1 };
  const th = await (await request.post("/api/cart/quote?locale=th", { data: body })).json();
  const en = await (await request.post("/api/cart/quote?locale=en", { data: body })).json();
  expect(th.lines[0].unitPrice).toBe(129000);
  expect(th.total).toBe(129000);
  expect(en).toEqual(th);
});

tc("TC-CART-07", "คำเตือน stock: เกิน stock/หมด และไม่เตือนที่ขอบ (qty = stock)", { level: "P1", section: "5.4", expected: "monstera ×5 ไม่เตือน, ×6 INSUFFICIENT_STOCK available 5 · tomato ×1 ไม่เตือน, ×2 available 1 · fiddle-leaf-fig ×1 OUT_OF_STOCK", source: "[D] spec ข้อ 13.4 warnings + seed stock monstera 5, tomato 1, fiddle 0" }, async ({ request }) => {
  const [m, t, f] = await Promise.all(["monstera", "tomato", "fiddle-leaf-fig"].map((s) => idOf(request, s)));
  const w = async (treeId: number, quantity: number) => (await (await quote(request, [{ treeId, quantity }])).json()).warnings;
  expect.soft(await w(m, 5)).toEqual([]);
  expect.soft(await w(m, 6)).toEqual([{ treeId: m, code: "INSUFFICIENT_STOCK", available: 5 }]);
  expect.soft(await w(t, 1)).toEqual([]);
  expect.soft(await w(t, 2)).toEqual([{ treeId: t, code: "INSUFFICIENT_STOCK", available: 1 }]);
  expect.soft(await w(f, 1)).toEqual([{ treeId: f, code: "OUT_OF_STOCK" }]);
});

tc("TC-CART-08", "ตรวจ input ของ quote: ค่าผิดทุกแบบได้ 400, ไม่พบสินค้าได้ 404", { level: "P1", section: "5.4", expected: "items ว่าง/ขาด, quantity 0/-1/1.5/'2'/1000, treeId ไม่ใช่เลข, 101 รายการ → 400 VALIDATION_ERROR · treeId 999999 → 404 NOT_FOUND", source: "[D] spec ข้อ 13.3 (VALIDATION_ERROR/NOT_FOUND) · constitution ข้อ II Zod" }, async ({ request }) => {
  const id = await idOf(request, "monstera");
  const bad: unknown[] = [{}, { items: [] }, { items: "x" }, { items: [{ treeId: id, quantity: 0 }] }, { items: [{ treeId: id, quantity: -1 }] },
    { items: [{ treeId: id, quantity: 1.5 }] }, { items: [{ treeId: id, quantity: "2" }] }, { items: [{ treeId: id, quantity: 1000 }] },
    { items: [{ treeId: "a", quantity: 1 }] }, { items: Array.from({ length: 101 }, () => ({ treeId: id, quantity: 1 })) }];
  for (const [i, data] of bad.entries()) {
    const r = await request.post("/api/cart/quote", { data });
    expect.soft(r.status(), `#${i}`).toBe(400);
    expect.soft((await r.json()).error, `#${i}`).toBe("VALIDATION_ERROR");
  }
  const nf = await quote(request, [{ treeId: 999999, quantity: 1 }]);
  expect.soft(nf.status()).toBe(404);
  expect.soft((await nf.json()).error).toBe("NOT_FOUND");
  expect.soft((await request.post("/api/cart/quote", { headers: { "content-type": "application/json" }, data: "{oops" })).status()).toBe(400);
});

tc("TC-CART-09", "ใส่ตะกร้า 2 ชิ้น: ยอดในหน้าตะกร้า = ราคา×จำนวน ตาม oracle และเท่ากับ API", { level: "P1", section: "5.4", expected: "พาชีร่า ฿890 × 2 = ฿1,780.00 (ส่งฟรี) total ฿1,780.00 · ตรงกับ /api/cart/quote", source: "[D] seed pachira 89000 stock 3 · spec ข้อ 4" }, async ({ page, request }) => {
  await page.goto("/th/trees/pachira");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await page.getByTestId("quantity-input").fill("2");
  await page.getByTestId("add-to-cart").click();
  await page.goto("/th/cart");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  const o = oracle(T.pachira.price * 2);
  await expect.soft(page.getByTestId("cart-qty")).toHaveText("2");
  await expect.soft(page.getByTestId("cart-subtotal")).toHaveText(baht(o.subtotal));
  await expect.soft(page.getByTestId("cart-shipping")).toHaveText("ฟรี");
  await expect.soft(page.getByTestId("cart-total")).toHaveText(baht(o.total));
  const api = await (await quote(request, [{ treeId: await idOf(request, "pachira"), quantity: 2 }])).json();
  expect.soft(api.total).toBe(o.total);
});

tc("TC-CART-10", "จำนวนไม่เกิน stock: ช่องจำนวน, ปุ่ม +, และการเพิ่มซ้ำ", { level: "P1", section: "5.4", expected: "พาชีร่า stock 3: พิมพ์ 99 → 3, พิมพ์ 0 → 1 · เพิ่ม 3 แล้วเพิ่มอีก 3 ในตะกร้ายัง 3 และปุ่ม + ใช้ไม่ได้", source: "[D] spec F3/F5 'จำนวนต้องไม่เกิน stock' · seed pachira stock 3" }, async ({ page }) => {
  await page.goto("/th/trees/pachira");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  const input = page.getByTestId("quantity-input");
  await input.fill("99");
  await expect.soft(input).toHaveValue("3");
  await input.fill("0");
  await expect.soft(input).toHaveValue("1");
  await input.fill("3");
  await page.getByTestId("add-to-cart").click();
  await page.getByTestId("add-to-cart").click();
  await page.goto("/th/cart");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("cart-qty")).toHaveText("3");
  await expect.soft(page.getByTestId("cart-inc")).toBeDisabled();
});

tc("TC-CART-11", "ลด/ลบรายการ: ลดไม่ต่ำกว่า 1, ลบแล้วตะกร้าว่าง", { level: "P2", section: "5.4", expected: "qty 2 → ลด 1 ครั้งเหลือ 1 และปุ่มลดใช้ไม่ได้ · กดลบแล้วเห็น cart-empty", source: "[D] spec F5 เพิ่ม/ลด/ลบ · [R] จำนวนต้องเป็นจำนวนเต็ม ≥ 1" }, async ({ page, request }) => {
  await seedCart(page, [cartItem("monstera", await idOf(request, "monstera"), 2)]);
  await page.getByTestId("cart-dec").click();
  await expect.soft(page.getByTestId("cart-qty")).toHaveText("1");
  await expect.soft(page.getByTestId("cart-dec")).toBeDisabled();
  await page.getByTestId("cart-remove").click();
  await expect.soft(page.getByTestId("cart-empty")).toBeVisible();
});

tc("TC-CART-12", "ตะกร้าอยู่หลังรีโหลดและสลับภาษา ชื่อเปลี่ยนตามภาษา ยอดเท่าเดิม", { level: "P2", section: "5.4", expected: "รีโหลดแล้วยังมี 1 รายการ · /en/cart ชื่อ Monstera ยอดรวม ฿1,290.00 เหมือน /th", source: "[D] spec ข้อ 9.1 'ตะกร้าไม่หาย' · seed monstera 129000" }, async ({ page, request }) => {
  await seedCart(page, [{ ...cartItem("monstera", await idOf(request, "monstera"), 1), nameTh: "มอนสเตอร่า", nameEn: "Monstera" }]);
  await expect.soft(page.getByTestId("cart-total")).toHaveText("฿1,290.00");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/en\/cart$/);
  const line = page.locator('[data-testid="cart-line"]:visible');
  await expect.soft(line).toContainText("Monstera");
  await expect.soft(page.locator('[data-testid="cart-total"]:visible')).toHaveText("฿1,290.00");
});

tc("TC-CART-13", "localStorage เสีย/ค่าแปลก: ถือว่าตะกร้าว่าง ไม่พัง", { level: "P2", section: "5.4", expected: "ใส่ '{bad', '[1,2]', '{\"a\":1}' แล้วเห็น cart-empty และไม่มี pageerror", source: "[R] ข้อมูลจากเบราว์เซอร์เชื่อไม่ได้ ต้องไม่ทำให้หน้าล้ม" }, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const raw of ["{bad", "[1,2]", '{"a":1}', "null"]) {
    await page.goto("/th/cart");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.evaluate((v) => localStorage.setItem("tree-shop-cart", v), raw);
    await page.reload();
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect.soft(page.getByTestId("cart-empty"), raw).toBeVisible();
  }
  expect(errors).toEqual([]);
});

tc("TC-CART-14", "ราคาหรือ stock เปลี่ยนตั้งแต่ใส่ตะกร้า: เตือน และแสดงยอดตามราคาจริง", { level: "P1", section: "5.4", expected: "เก็บราคา ฿0.01 ไว้ แต่ราคาจริง ฿1,290.00 → มี cart-warning และยอดรวม ฿1,290.00 · เก็บจำนวน 6 (stock 5) → เตือน 'เหลือเพียง 5'", source: "[D] spec F5 + 13.4 warnings · seed monstera price 129000 stock 5" }, async ({ page, request }) => {
  const id = await idOf(request, "monstera");
  await seedCart(page, [{ ...cartItem("monstera", id, 1), price: 1 }]);
  await expect.soft(page.getByTestId("cart-warning")).toBeVisible();
  await expect.soft(page.getByTestId("cart-total")).toHaveText("฿1,290.00");
  await seedCart(page, [{ ...cartItem("monstera", id, 6), stock: 99 }]);
  await expect.soft(page.getByTestId("cart-warning")).toContainText("5");
});

tc("TC-CART-15", "ตะกร้าว่างไม่เรียก API และมีทางไปเลือกต้นไม้", { level: "P3", section: "5.4", expected: "เข้า /th/cart ตะกร้าว่าง: ไม่มี request ไป /api/cart/quote · มีลิงก์ 'ดูต้นไม้ทั้งหมด'", source: "[R] ไม่ควรเรียก server โดยไม่จำเป็น · [D] spec F5" }, async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => r.url().includes("/api/cart/quote") && calls.push(r.url()));
  await page.goto("/th/cart");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("cart-empty")).toBeVisible();
  await expect.soft(page.getByRole("link", { name: "ดูต้นไม้ทั้งหมด" }).first()).toBeVisible();
  expect(calls).toEqual([]);
});
