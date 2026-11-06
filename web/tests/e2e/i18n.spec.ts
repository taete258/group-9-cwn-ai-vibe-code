import { expect, test } from "@playwright/test";

// FR-019 / US-11: หน้า /en ต้องไม่มีอักษรไทยหลงอยู่ ยกเว้นป้ายปุ่มสลับภาษา "ภาษาไทย" และช่อง "ชื่อไทย" ในหน้ารายละเอียด
const PAGES = ["/en", "/en/trees", "/en/trees?collection=lucky", "/en/trees/monstera", "/en/trees/mint", "/en/trees/no-such-tree", "/en/feng-shui", "/en/feng-shui?room=LIVING&benefit=WEALTH", "/en/feng-shui?room=LIVING&benefit=LOVE", "/en/cart", "/en/nope"];

for (const url of PAGES) {
  test(`ไม่มีข้อความไทยหลงใน ${url}`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="plant-names"]').forEach((e) => e.remove());
    });
    const text = (await page.locator("body").innerText()).replace(/฿|ภาษาไทย/g, ""); // ฿ อยู่ในบล็อกอักษรไทยแต่เป็นสัญลักษณ์เงิน
    expect(text.match(/[฀-๿]+/g) ?? []).toEqual([]);
  });
}
