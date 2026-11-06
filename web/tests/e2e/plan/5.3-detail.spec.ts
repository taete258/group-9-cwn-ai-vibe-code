import { expect, test } from "@playwright/test";
import { hl, tc } from "./helpers";

tc("TC-DET-01", "รายละเอียดมอนสเตอร่า: ราคา คงเหลือ การดูแล ฮวงจุ้ย", { level: "P1", section: "5.3", expected: "ราคา ฿1,290.00 · คงเหลือ 5 · แสง/น้ำ/ความสูง 60 ซม./กระถาง 8 นิ้ว/ความยาก · กล่องฮวงจุ้ย ห้องนั่งเล่น ทิศตะวันออกเฉียงใต้", source: "[D] seed: monstera price 129000 stock 5 height 60 pot 8; feng-shui LIVING/WEALTH/SE" }, async ({ page }) => {
  await page.goto("/th/trees/monstera");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(await hl(page.getByTestId("tree-price"))).toHaveText("฿1,290.00");
  await expect.soft(page.getByTestId("tree-stock")).toContainText("5");
  const care = page.getByTestId("care-info");
  for (const t of ["60 ซม.", "8 นิ้ว", "แสง", "น้ำ", "ความยากในการดูแล"]) await expect.soft(care).toContainText(t);
  const fs = page.getByTestId("feng-shui-box");
  for (const t of ["ห้องนั่งเล่น", "ทิศตะวันออกเฉียงใต้", "คำแนะนำตามความเชื่อ เพื่อความสบายใจ"]) await expect.soft(fs).toContainText(t);
});

tc("TC-DET-02", "สินค้าที่เกี่ยวข้อง 4 รายการ ไม่รวมตัวเอง และอยู่หมวดเดียวกัน", { level: "P1", section: "5.3", expected: "4 การ์ด ไม่มี monstera · ทุกต้นอยู่ในหมวด decor (มอนสเตอร่าอยู่ decor)", source: "[D] spec F3 + seed decor = monstera, zz-plant, pachira, fiddle-leaf-fig, rubber-plant, snake-plant, peace-lily, aloe-vera, boston-fern, orchid, areca-palm" }, async ({ page }) => {
  await page.goto("/th/trees/monstera");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  const related = page.getByTestId("related-tree");
  await expect(related).toHaveCount(4);
  const slugs = await related.evaluateAll((els) => els.map((e) => (e.getAttribute("href") ?? "").split("/").pop()!));
  expect(slugs).not.toContain("monstera");
  const decor = ["zz-plant", "pachira", "fiddle-leaf-fig", "rubber-plant", "snake-plant", "peace-lily", "aloe-vera", "boston-fern", "orchid", "areca-palm"];
  for (const s of slugs) expect.soft(decor, s).toContain(s);
});

tc("TC-DET-03", "stock = 0: ขึ้นสินค้าหมดและกดใส่ตะกร้าไม่ได้ (boundary)", { level: "P1", section: "5.3", expected: "tree-stock = 'สินค้าหมด' และ add-to-cart disabled · ส่วน stock 1 (มะเขือเทศ) ยังกดได้", source: "[D] seed fiddle-leaf-fig stock 0, tomato stock 1" }, async ({ page }) => {
  await page.goto("/th/trees/fiddle-leaf-fig");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("tree-stock")).toHaveText("สินค้าหมด");
  await expect.soft(await hl(page.getByTestId("add-to-cart"))).toBeDisabled();
  await page.goto("/th/trees/tomato");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("add-to-cart")).toBeEnabled();
});

tc("TC-DET-04", "ไม่มีรูป / ไม่มีฮวงจุ้ย: หน้าไม่พัง", { level: "P2", section: "5.3", expected: "mint (0 รูป) มี gallery-placeholder และราคา ฿120.00 · aloe-vera (ไม่มีฮวงจุ้ย) ไม่มี feng-shui-box", source: "[D] seed: mint images=0; aloe-vera ไม่มีแถว FengShui · spec F3 'ถ้าต้นนั้นมีข้อมูล'" }, async ({ page }) => {
  await page.goto("/th/trees/mint");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("gallery-placeholder")).toBeVisible();
  await expect.soft(page.getByTestId("tree-price")).toHaveText("฿120.00");
  await page.goto("/th/trees/aloe-vera");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("tree-price")).toHaveText("฿250.00");
  await expect.soft(page.getByTestId("feng-shui-box")).toHaveCount(0);
});

tc("TC-DET-05", "แกลเลอรี: รูปเดียวไม่มีตัวเลื่อน รูปหลายรูปขยายและเลื่อนได้", { level: "P2", section: "5.3", expected: "zz-plant (1 รูป) ไม่มี thumb · monstera (3 รูป) มี 3 thumb เปิดขยายแล้วกดถัดไปได้", source: "[D] seed images: zz-plant=1, monstera=3 · spec F3 ปัดดูและกดขยายได้" }, async ({ page }) => {
  await page.goto("/th/trees/zz-plant");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("gallery-thumb")).toHaveCount(0);
  await page.goto("/th/trees/monstera");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await expect.soft(page.getByTestId("gallery-thumb")).toHaveCount(3);
  await page.getByTestId("gallery-zoom").click();
  const d = page.getByTestId("gallery-dialog");
  await expect.soft(d).toBeVisible();
  await d.getByTestId("gallery-next").click();
  await expect.soft(d.locator("img")).toHaveAttribute("src", /monstera-2/);
  await page.keyboard.press("Escape");
  await expect.soft(d).toBeHidden();
});

tc("TC-DET-06", "ไม่พบสินค้า/ต้นที่ซ่อน: หน้าแจ้งข้อความ + API 404 NOT_FOUND", { level: "P1", section: "5.3", expected: "หน้ามี error-message และลิงก์กลับ · /api/trees/<slug> ได้ 404 {error:'NOT_FOUND'}", source: "[D] spec ข้อ 13.3 (404 NOT_FOUND) · seed hidden-test-tree isActive=false" }, async ({ page, request }) => {
  for (const slug of ["no-such-tree", "hidden-test-tree"]) {
    await page.goto(`/th/trees/${slug}`);
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect.soft(page.getByTestId("error-message"), slug).toBeVisible();
    const r = await request.get(`/api/trees/${slug}`);
    expect.soft(r.status(), slug).toBe(404);
    expect.soft((await r.json()).error, slug).toBe("NOT_FOUND");
  }
});

tc("TC-DET-07", "⚠️ หน้า HTML ของสินค้าที่ไม่พบต้องตอบสถานะ 404", { level: "P3", section: "5.3", expected: "GET /th/trees/no-such-tree → HTTP 404", source: "[R] กฎทั่วไปของเว็บ: หน้าไม่พบต้องตอบ 404 ไม่ใช่ 200 (soft 404) · [O] พบว่าตอบ 200" }, async ({ request }) => {
  test.fail(true, "triage: เว็บผิด — Next.js ส่งสถานะ 200 เมื่อ notFound() ถูกเรียกหลังเริ่ม stream");
  expect((await request.get("/th/trees/no-such-tree")).status()).toBe(404);
});
