import { expect, test } from "@playwright/test";

// ข้อมูลจาก seed: monstera (3 รูป, ฮวงจุ้ย, หมวด decor), aloe-vera (ไม่มีฮวงจุ้ย), fiddle-leaf-fig (stock 0),
// zz-plant (1 รูป), mint (ไม่มีรูป), hidden-test-tree (ซ่อน)
test.describe("หน้ารายละเอียด (US2)", () => {
  test("แสดงข้อมูลครบในหน้าเดียว: ราคา คงเหลือ การดูแล ฮวงจุ้ย สินค้าที่เกี่ยวข้อง", async ({ page }) => {
    await page.goto("/th/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByRole("heading", { level: 1, name: "มอนสเตอร่า" })).toBeVisible();
    await expect(page.getByTestId("tree-price")).toHaveText("฿1,290.00");
    await expect(page.getByTestId("tree-stock")).toContainText("5");
    await expect(page.getByText("ไม้ใบทรงใหญ่ที่มีรอยฉลุ")).toBeVisible();

    const care = page.getByTestId("care-info");
    for (const label of ["แสง", "น้ำ", "ความสูง", "ขนาดกระถาง", "ความยากในการดูแล"]) await expect(care).toContainText(label);
    await expect(care).toContainText("60 ซม.");
    await expect(care).toContainText("8 นิ้ว");
    await expect(care).toContainText("เป็นพิษต่อสัตว์เลี้ยง");

    const fs = page.getByTestId("feng-shui-box");
    await expect(fs).toContainText("ห้องนั่งเล่น");
    await expect(fs).toContainText("ทิศตะวันออกเฉียงใต้");
    await expect(fs).toContainText("ทิศแห่งทรัพย์");
    await expect(fs).toContainText("โชคลาภ"); // คำอธิบายว่าเรื่อง "การเงิน" เสริมอะไรบ้าง
    await expect(fs).toContainText("คำแนะนำตามความเชื่อ เพื่อความสบายใจ");

    const related = page.getByTestId("related-tree");
    await expect(related).toHaveCount(4);
    await expect(page.locator('[data-testid="related-tree"][href$="/trees/monstera"]')).toHaveCount(0);
    await related.first().click();
    await expect(page).toHaveURL(/\/th\/trees\/(?!monstera)[a-z-]+$/);
  });

  test("ชื่อไทย/อังกฤษคู่กัน ชื่อวิทยาศาสตร์ แหล่งกำเนิด และคำอธิบายยาว", async ({ page }) => {
    await page.goto("/th/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    const names = page.getByTestId("plant-names");
    await expect(names).toContainText("ชื่อไทย");
    await expect(names).toContainText("มอนสเตอร่า");
    await expect(names).toContainText("ชื่ออังกฤษ");
    await expect(names).toContainText("Monstera");
    await expect(names).toContainText("Monstera deliciosa");
    await expect(names).toContainText("แหล่งกำเนิด");
    await expect(names).toContainText("อเมริกากลาง");
    expect((await page.getByTestId("tree-description").innerText()).length).toBeGreaterThan(300);

    await page.goto("/en/trees/monstera");

    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("plant-names")).toContainText("Scientific name");
    await expect(page.getByTestId("plant-names")).toContainText("Central America");
    expect((await page.getByTestId("tree-description").innerText()).split(/\s+/).length).toBeGreaterThan(60);
  });

  test("หลายรูป: กดรูปแล้วขยาย และเลื่อนไปรูปถัดไปได้", async ({ page }) => {
    await page.goto("/th/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("gallery-thumb")).toHaveCount(3);
    await page.getByTestId("gallery-zoom").click();
    const dialog = page.getByTestId("gallery-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveAttribute("src", /monstera-1/);
    await dialog.getByTestId("gallery-next").click();
    await expect(dialog.locator("img")).toHaveAttribute("src", /monstera-2/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("รูปเดียว: ไม่มีตัวเลื่อนรูป", async ({ page }) => {
    await page.goto("/th/trees/zz-plant");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("gallery")).toBeVisible();
    await expect(page.getByTestId("gallery-thumb")).toHaveCount(0);
    await page.getByTestId("gallery-zoom").click();
    await expect(page.getByTestId("gallery-next")).toHaveCount(0);
  });

  test("ไม่มีรูป: แสดงรูปแทนที่ หน้าไม่พัง", async ({ page }) => {
    await page.goto("/th/trees/mint");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("gallery-placeholder")).toBeVisible();
    await expect(page.getByTestId("tree-price")).toBeVisible();
  });

  test("ไม่มีข้อมูลฮวงจุ้ย: ไม่แสดงกล่อง", async ({ page }) => {
    await page.goto("/th/trees/aloe-vera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("tree-price")).toBeVisible();
    await expect(page.getByTestId("feng-shui-box")).toHaveCount(0);
  });

  test("stock = 0: แสดงว่าสินค้าหมด", async ({ page }) => {
    await page.goto("/th/trees/fiddle-leaf-fig");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("tree-stock")).toHaveText("สินค้าหมด");
  });

  for (const slug of ["no-such-tree", "hidden-test-tree"]) {
    test(`ไม่พบ/ซ่อน (${slug}): ข้อความไม่พบสินค้า พร้อมทางกลับ`, async ({ page }) => {
      await page.goto(`/th/trees/${slug}`);
      await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
      await expect(page.getByTestId("error-message")).toBeVisible();
      await expect(page.getByRole("link", { name: "กลับหน้าแรก" })).toHaveAttribute("href", "/th");
      await expect(page.getByRole("link", { name: "ดูต้นไม้ทั้งหมด" })).toHaveAttribute("href", "/th/trees");
    });
  }

  test("ภาษาอังกฤษใช้ slug เดียวกัน", async ({ page }) => {
    await page.goto("/en/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByRole("heading", { level: 1, name: "Monstera" })).toBeVisible();
    await expect(page.getByTestId("feng-shui-box")).toContainText("Living room");
  });
});
