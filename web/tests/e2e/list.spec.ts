import { expect, test, type Page } from "@playwright/test";

// :visible — Next 16 (cacheComponents) เก็บ DOM ของหน้าก่อนหน้าไว้แบบซ่อนหลังนำทางฝั่ง client
const cards = (page: Page) => page.locator('[data-testid^="tree-card-"]:visible');
const apiSlugs = async (page: Page, qs: string) =>
  ((await (await page.request.get(`/api/trees${qs}`)).json()) as { slug: string }[]).map((t) => t.slug);
const pageSlugs = async (page: Page) =>
  (await cards(page).evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!.replace("tree-card-", ""))));

test.describe("หน้ารายการ (US3)", () => {
  test("เปิดแล้วเห็นต้นไม้ทั้ง 20 ต้น ไม่มีต้นที่ซ่อน", async ({ page }) => {
    await page.goto("/th/trees");
    await expect(page.getByRole("heading", { level: 1, name: "ต้นไม้ทั้งหมด" })).toBeVisible();
    await expect(cards(page)).toHaveCount(20);
    await expect(page.getByTestId("tree-card-hidden-test-tree")).toHaveCount(0);
  });

  test("ตัวกรองตามขนาด + สายพันธุ์ + ปลอดภัยต่อสัตว์เลี้ยง ผลตรงกับ API และอยู่ใน URL", async ({ page }) => {
    await page.goto("/th/trees");
    await page.getByTestId("filter-size").getByText("ใหญ่", { exact: true }).click();
    await page.getByTestId("filter-pet-safe").check();
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(page).toHaveURL(/size=L/);
    await expect(page).toHaveURL(/petSafe=1/);
    await expect(cards(page)).toHaveCount(2);
    await expect.poll(async () => (await pageSlugs(page)).sort()).toEqual((await apiSlugs(page, "?size=L&petSafe=1")).sort());

    await page.getByTestId("filter-species").getByText("ไม้ผล", { exact: true }).click();
    await page.getByTestId("filter-care").getByText("ยาก", { exact: true }).click();
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(page.getByTestId("tree-card-mango-tree")).toBeVisible();
  });

  test("กรองตามหมวด", async ({ page }) => {
    await page.goto("/th/trees");
    await page.getByTestId("filter-collection").getByText("เสริมดวง", { exact: true }).click();
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(page).toHaveURL(/collection=lucky/);
    await expect.poll(async () => (await pageSlugs(page)).sort()).toEqual((await apiSlugs(page, "?collection=lucky")).sort());
  });

  test("ค้นหาชื่อไทยและอังกฤษ ได้ต้นเดียวกันทั้งสองภาษาของหน้า", async ({ page }) => {
    for (const [locale, q] of [["th", "มอนสเตอร่า"], ["th", "monstera"], ["en", "Monstera"], ["en", "มอนสเตอร่า"]]) {
      await page.goto(`/${locale}/trees`);
      await page.getByTestId("search-input").fill(q);
      await page.getByTestId("search-input").press("Enter");
      await expect(cards(page), `${locale}:${q}`).toHaveCount(1);
      await expect(page.getByTestId("tree-card-monstera")).toBeVisible();
    }
  });

  test("เรียงลำดับราคา", async ({ page }) => {
    await page.goto("/th/trees");
    await page.getByTestId("sort-select").selectOption("price_asc");
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect.poll(() => pageSlugs(page)).toEqual(await apiSlugs(page, "?sort=price_asc"));
    await expect(cards(page).first()).toHaveAttribute("data-testid", "tree-card-holy-basil");
    await page.getByTestId("sort-select").selectOption("price_desc");
    await page.getByRole("button", { name: "ค้นหา" }).click();
    await expect(cards(page).first()).toHaveAttribute("data-testid", "tree-card-mango-tree");
  });

  test("คัดลอก URL เปิดแท็บใหม่ได้ผลและตัวกรองเหมือนเดิม", async ({ page, context }) => {
    await page.goto("/th/trees?size=L&petSafe=1&sort=price_desc&q=%E0%B8%AB");
    const url = page.url();
    const other = await context.newPage();
    await other.goto(url);
    await expect.poll(() => pageSlugs(other)).toEqual(await pageSlugs(page));
    await expect(other.getByTestId("filter-pet-safe")).toBeChecked();
    await expect(other.getByTestId("sort-select")).toHaveValue("price_desc");
    await expect(other.getByTestId("search-input")).toHaveValue("ห");
    await expect(other.getByTestId("filter-size").getByLabel("ใหญ่")).toBeChecked();
  });

  test("ค่าใน URL ผิด → ไม่ error ใช้ค่าเริ่มต้น", async ({ page }) => {
    const res = await page.goto("/th/trees?size=XL&sort=bad&care=zzz");
    expect(res?.status()).toBeLessThan(400);
    await expect(cards(page)).toHaveCount(20);
    await expect(page.getByTestId("sort-select")).toHaveValue("newest");
  });

  test("q เป็นช่องว่างล้วน ไม่พัง ถือว่าไม่ค้นหา", async ({ page }) => {
    await page.goto("/th/trees?q=%20%20");
    await expect(cards(page)).toHaveCount(20);
  });

  test("ไม่พบผลลัพธ์: ข้อความ + ปุ่มล้างตัวกรอง", async ({ page }) => {
    await page.goto("/th/trees?q=zzzz-no-match");
    await expect(page.getByTestId("error-message")).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.getByTestId("clear-filters").click();
    await expect(page).toHaveURL(/\/th\/trees$/);
    await expect(cards(page)).toHaveCount(20);
  });

  test("สลับภาษาแล้วอยู่หน้าเดิมและคงตัวกรอง", async ({ page }) => {
    await page.goto("/th/trees?size=L");
    await page.getByTestId("lang-switch").click();
    await expect(page).toHaveURL(/\/en\/trees\?size=L/);
    await expect(cards(page)).toHaveCount(5);
  });

  test("ลิงก์ ดูทั้งหมด จากหน้าแรกพาไปรายการที่กรองแล้ว", async ({ page }) => {
    await page.goto("/th");
    await page.getByTestId("collection-row-size-L").getByRole("link", { name: /ดูทั้งหมด/ }).click();
    await expect(page).toHaveURL(/\/th\/trees\?size=L/);
    await expect(cards(page)).toHaveCount(5);
  });
});

test.describe("กรณีขอบ (spec Edge Cases)", () => {
  test("prefix ภาษาที่ไม่รองรับ / path ที่ไม่มี → หน้า ไม่พบหน้านี้ (ในเลย์เอาต์ของเว็บ)", async ({ page }) => {
    for (const u of ["/fr/trees", "/th/no-such-page", "/en/no-such-page"]) {
      await page.goto(u);
      // /fr/... ไม่มี prefix ที่รองรับ → เลือกภาษาตามเบราว์เซอร์ (FR-017) แล้วแสดง not-found ภาษานั้น
      const expected = u === "/fr/trees" ? /ไม่พบหน้านี้|Page not found/ : u.startsWith("/en") ? /Page not found/ : /ไม่พบหน้านี้/;
      await expect(page.getByTestId("error-message"), u).toHaveText(expected);
      await expect(page.getByTestId("lang-switch"), u).toBeVisible(); // อยู่ใน layout ปกติ ไม่ใช่หน้า 404 ของ Next
    }
  });

  test("อักขระพิเศษของ SQL LIKE (% _) ไม่ทำงานเป็น wildcard", async ({ request }) => {
    const names = async (qs: string) => ((await (await request.get(`/api/trees?${qs}`)).json()) as { slug: string }[]).map((t) => t.slug);
    expect(await names("q=Mon%25ra")).toEqual([]); // "Mon%ra" ต้องไม่ match Monstera
    expect(await names("q=M_nstera")).toEqual([]);
    expect(await names("q=Monstera")).toEqual(["monstera"]);
  });

  test("คำค้นที่มีแต่อักขระพิเศษ ถือว่าไม่ได้ค้นหา", async ({ request }) => {
    for (const q of ["%25", "_", "'", "%5C", "!!!", "%20%25%20"]) {
      const res = await request.get(`/api/trees?q=${q}`);
      expect(res.status(), q).toBe(200);
      expect((await res.json()).length, q).toBe(20);
    }
  });
});
