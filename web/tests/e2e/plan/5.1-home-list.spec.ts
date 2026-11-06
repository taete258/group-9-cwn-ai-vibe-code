import { expect, test } from "@playwright/test";
import { ALL_PRICES, hl, parseBaht, tc } from "./helpers";

const cards = (page: import("@playwright/test").Page) => page.locator('[data-testid^="tree-card-"]:visible');
const slugs = async (page: import("@playwright/test").Page) =>
  (await cards(page).evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!.replace("tree-card-", "")))).sort();

test.describe("5.1 หน้าแรก", () => {
  tc("TC-HOME-01", "แถวหมวดเรียงตามลำดับใน seed", { level: "P1", section: "5.1", expected: "แถว: lucky, decor, edible ตามด้วยขนาด S/M/L และสายพันธุ์ 5 แถว (รวม 11) · ไม่มี archived/empty", source: "[D] spec F1 + seed (sortOrder 1,2,3; archived ปิด; empty ไม่มีต้นที่เปิดขาย)" }, async ({ page }) => {
    await page.goto("/th");
    const ids = await page.locator('[data-testid^="collection-row-"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
    expect(ids).toEqual(["lucky", "decor", "edible", "size-S", "size-M", "size-L", "species-FOLIAGE", "species-FLOWERING", "species-SUCCULENT", "species-FRUIT", "species-HERB"].map((k) => `collection-row-${k}`));
  });

  tc("TC-HOME-02", "ต้นที่ซ่อนและหมวดที่ปิดไม่ปรากฏ", { level: "P1", section: "5.1", expected: "ไม่พบการ์ด hidden-test-tree และไม่พบแถว archived/empty", source: "[D] seed: hidden-test-tree isActive=false · หมวด archived isActive=false" }, async ({ page }) => {
    await page.goto("/th");
    await expect.soft(page.getByTestId("tree-card-hidden-test-tree")).toHaveCount(0);
    await expect.soft(page.getByTestId("collection-row-archived")).toHaveCount(0);
    await expect.soft(page.getByTestId("collection-row-empty")).toHaveCount(0);
  });

  tc("TC-HOME-03", "ป้ายสินค้าหมดเฉพาะ stock = 0 (boundary 0/1)", { level: "P2", section: "5.1", expected: "ไทรใบสัก (stock 0) มีป้าย 'สินค้าหมด' · มะเขือเทศ (stock 1) ไม่มี", source: "[D] seed stock: fiddle-leaf-fig=0, tomato=1" }, async ({ page }) => {
    await page.goto("/th");
    const fig = page.getByTestId("collection-row-decor").getByTestId("tree-card-fiddle-leaf-fig");
    await expect.soft(await hl(fig.getByTestId("sold-out-badge"))).toHaveText("สินค้าหมด");
    await expect.soft(page.getByTestId("collection-row-edible").getByTestId("tree-card-tomato").getByTestId("sold-out-badge")).toHaveCount(0);
  });

  tc("TC-HOME-04", "ราคาบนการ์ดรูปแบบ ฿#,###.## ตามราคาใน seed", { level: "P2", section: "5.1", expected: "กวักมรกต ฿450.00 · มะม่วงแคระ ฿2,400.00 · กะเพรา ฿90.00", source: "[D] seed price (สตางค์ ÷ 100) · spec ข้อ 9.1 รูปแบบ ฿1,290.00" }, async ({ page }) => {
    await page.goto("/th");
    await expect.soft(page.getByTestId("collection-row-lucky").getByTestId("tree-card-zz-plant").getByTestId("card-price")).toHaveText("฿450.00");
    await expect.soft(page.getByTestId("collection-row-edible").getByTestId("tree-card-mango-tree").getByTestId("card-price")).toHaveText("฿2,400.00");
    await expect.soft(page.getByTestId("collection-row-edible").getByTestId("tree-card-holy-basil").getByTestId("card-price")).toHaveText("฿90.00");
  });
});

test.describe("5.2 รายการ ค้นหา กรอง เรียง", () => {
  tc("TC-LIST-01", "ไม่กรอง: แสดงต้นที่เปิดขายครบ 20 ต้น ไม่มีต้นซ่อน", { level: "P1", section: "5.2", expected: "20 การ์ด · ไม่มี hidden-test-tree", source: "[D] seed: 21 ต้น ซ่อน 1" }, async ({ page }) => {
    await page.goto("/th/trees");
    await expect.poll(async () => (await slugs(page)).length).toBe(20);
    expect(await slugs(page)).not.toContain("hidden-test-tree");
  });

  const filters: [string, string, string[]][] = [
    ["TC-LIST-02", "collection=lucky", ["zz-plant", "syngonium", "lucky-bamboo", "jade-plant", "pachira", "snake-plant", "orchid"]],
    ["TC-LIST-03", "collection=edible", ["lime-tree", "chili", "holy-basil", "tomato", "mint", "mango-tree"]],
    ["TC-LIST-04", "size=S&species=HERB", ["holy-basil", "mint"]],
    ["TC-LIST-05", "care=HARD", ["orchid", "mango-tree"]],
    ["TC-LIST-06", "petSafe=1", ["pachira", "boston-fern", "holy-basil", "mint", "mango-tree", "orchid", "areca-palm"]],
  ];
  for (const [id, q, expected] of filters) {
    tc(id, `กรอง ${q}`, { level: "P1", section: "5.2", expected: `ได้ ${expected.length} ต้น: ${expected.join(", ")}`, source: "[D] seed (หมวด/ขนาด/สายพันธุ์/ระดับดูแล/petSafe ของแต่ละต้น)" }, async ({ page }) => {
      await page.goto(`/th/trees?${q}`);
      await expect.poll(() => slugs(page)).toEqual([...expected].sort());
    });
  }

  tc("TC-LIST-07", "เรียงราคาต่ำ→สูง และสูง→ต่ำ", { level: "P1", section: "5.2", expected: "ลำดับราคาบนการ์ดเท่ากับราคาทั้ง 20 ต้นที่เรียงเอง (฿90 ... ฿2,400)", source: "[D] seed price · spec F2 เรียงลำดับ" }, async ({ page }) => {
    const asc = [...ALL_PRICES].sort((a, b) => a - b);
    for (const [sort, expected] of [["price_asc", asc], ["price_desc", [...asc].reverse()]] as const) {
      await page.goto(`/th/trees?sort=${sort}`);
      await expect.poll(async () => (await page.locator('[data-testid="card-price"]:visible').allInnerTexts()).map(parseBaht)).toEqual(expected);
    }
  });

  tc("TC-LIST-08", "ค้นหาชื่อไทย/อังกฤษ/ตัวพิมพ์ต่างกัน ได้ผลเดียวกัน", { level: "P1", section: "5.2", expected: "'กะเพรา' 'basil' 'BASIL' ได้ holy-basil ต้นเดียว · 'มอนสเตอร่า' ในหน้าอังกฤษก็พบ monstera", source: "[D] seed ชื่อ · spec ข้อ 9.1 ค้นจากชื่อทั้งสองภาษาพร้อมกัน" }, async ({ page }) => {
    for (const q of ["กะเพรา", "basil", "BASIL"]) {
      await page.goto(`/th/trees?q=${encodeURIComponent(q)}`);
      await expect.poll(() => slugs(page), { message: q }).toEqual(["holy-basil"]);
    }
    await page.goto(`/en/trees?q=${encodeURIComponent("มอนสเตอร่า")}`);
    await expect.poll(() => slugs(page)).toEqual(["monstera"]);
  });

  tc("TC-LIST-09", "ไม่พบผลลัพธ์: ข้อความ + ปุ่มล้างตัวกรอง และ wildcard % _ ไม่ทำงาน", { level: "P2", section: "5.2", expected: "q=zzzz และ q=% ไม่มีการ์ดและมี error-message · กดล้างแล้วกลับมา 20 ต้น", source: "[R] ค้นแล้วไม่พบต้องบอกผู้ใช้ · [D] ไม่มีชื่อต้นไหนมี % หรือ zzzz" }, async ({ page }) => {
    await page.goto("/th/trees?q=zzzz");
    await expect(page.getByTestId("error-message")).toBeVisible();
    await expect.poll(async () => (await slugs(page)).length).toBe(0);
    await page.goto("/th/trees?q=%25&size=S");
    await expect.poll(async () => (await slugs(page)).length, { message: "% ต้องไม่เป็น wildcard (ถูกมองว่าไม่ใช่คำค้นจึงกรองแค่ size=S = 8 ต้น)" }).toBe(8);
    await page.goto("/th/trees?q=zzzz");
    await page.getByTestId("clear-filters").click();
    await expect.poll(async () => (await slugs(page)).length).toBe(20);
  });

  tc("TC-LIST-10", "กรองผ่านฟอร์มแล้วค่าอยู่ใน URL และรีโหลดแล้วเหมือนเดิม", { level: "P2", section: "5.2", expected: "เลือกสายพันธุ์ สมุนไพร แล้วกดค้นหา URL มี species=HERB เหลือ 2 ต้น (holy-basil, mint) ... เทียบ seed: HERB มี 2 ต้น", source: "[D] seed species · spec F2 ค่ากรองอยู่ใน URL" }, async ({ page }) => {
    await page.goto("/th/trees");
    await page.getByTestId("filter-species").getByText("สมุนไพร").click();
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(page).toHaveURL(/species=HERB/);
    await expect.poll(() => slugs(page)).toEqual(["holy-basil", "mint"]);
    await page.reload();
    await expect.poll(() => slugs(page)).toEqual(["holy-basil", "mint"]);
  });

  tc("TC-LIST-11", "API /api/trees: ค่าผิดได้ 400 และไม่มีต้นซ่อน", { level: "P1", section: "5.2", expected: "sort=bogus, size=XL, locale=fr → 400 VALIDATION_ERROR · รายการมี 20 ต้นและไม่มี hidden-test-tree", source: "[D] spec ข้อ 13.1/13.3 (error contract) + seed" }, async ({ request }) => {
    for (const q of ["sort=bogus", "size=XL", "species=ROCK", "locale=fr"]) {
      const r = await request.get(`/api/trees?${q}`);
      expect.soft(r.status(), q).toBe(400);
      expect.soft((await r.json()).error, q).toBe("VALIDATION_ERROR");
    }
    const list = await (await request.get("/api/trees")).json();
    expect(list).toHaveLength(20);
    expect(list.map((t: { slug: string }) => t.slug)).not.toContain("hidden-test-tree");
  });
});
