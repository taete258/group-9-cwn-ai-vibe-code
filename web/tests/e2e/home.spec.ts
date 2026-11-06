import { expect, test } from "@playwright/test";

const ROW_IDS = [
  "collection-row-lucky", "collection-row-decor", "collection-row-edible",
  "collection-row-size-S", "collection-row-size-M", "collection-row-size-L",
  "collection-row-species-FOLIAGE", "collection-row-species-FLOWERING", "collection-row-species-SUCCULENT",
  "collection-row-species-FRUIT", "collection-row-species-HERB",
];

test.describe("หน้าแรก (US1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/th");
  });

  test("แถวตามลำดับ: หมวด → ขนาด → สายพันธุ์ และไม่มีหมวดซ่อน/ว่าง", async ({ page }) => {
    const ids = await page.locator('[data-testid^="collection-row-"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")));
    expect(ids).toEqual(ROW_IDS);
    await expect(page.getByTestId("collection-row-archived")).toHaveCount(0);
    await expect(page.getByTestId("collection-row-empty")).toHaveCount(0);
  });

  test("การ์ด: ชื่อ ราคารวม VAT และป้ายสินค้าหมดเฉพาะ stock = 0", async ({ page }) => {
    const decor = page.getByTestId("collection-row-decor");
    const monstera = decor.getByTestId("tree-card-monstera");
    await expect(monstera).toContainText("มอนสเตอร่า");
    await expect(monstera.getByTestId("card-price")).toHaveText("฿1,290.00");
    await expect(monstera.getByTestId("sold-out-badge")).toHaveCount(0);

    const fiddle = decor.getByTestId("tree-card-fiddle-leaf-fig");
    await expect(fiddle.getByTestId("sold-out-badge")).toHaveText("สินค้าหมด");
  });

  test("ต้นไม้ที่ซ่อนไม่ปรากฏ", async ({ page }) => {
    await expect(page.getByTestId("tree-card-hidden-test-tree")).toHaveCount(0);
    await expect(page.getByText("ต้นไม้ทดสอบ")).toHaveCount(0);
  });

  test("ลิงก์ ดูทั้งหมด ชี้ URL ที่กรองไว้", async ({ page }) => {
    const hrefOf = (row: string) => page.getByTestId(row).getByRole("link", { name: "ดูทั้งหมด" }).getAttribute("href");
    expect(await hrefOf("collection-row-lucky")).toBe("/th/trees?collection=lucky");
    expect(await hrefOf("collection-row-size-S")).toBe("/th/trees?size=S");
    expect(await hrefOf("collection-row-species-HERB")).toBe("/th/trees?species=HERB");
  });

  test("แถวเลื่อนแนวนอนในตัวเอง ไม่ใช่ทั้งหน้า (375px)", async ({ page }) => {
    const scroller = page.getByTestId("collection-row-decor").locator("[data-scroller]");
    await expect(scroller).toBeVisible();
    // รอให้ CSS ใช้งานแล้วค่อยวัด: แถวต้องเลื่อนได้เอง แต่ทั้งหน้าห้ามเลื่อนแนวนอน
    await expect.poll(() => scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(pageOverflow).toBe(false);
  });

  test("หน้าแรกไม่มีช่องค้นหา ตะกร้า หรือปุ่มซื้อ (นอกขอบเขต)", async ({ page }) => {
    await expect(page.getByTestId("search-input")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /ตะกร้า|ซื้อ/ })).toHaveCount(0);
  });
});
