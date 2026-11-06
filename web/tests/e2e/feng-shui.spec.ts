import { expect, test } from "@playwright/test";

// seed: LIVING+WEALTH = monstera, syngonium, pachira · LIVING+LOVE = ไม่มี
test.describe("GET /api/feng-shui", () => {
  test("ห้องนั่งเล่น + การเงิน → รายการพร้อมทิศและเหตุผล", async ({ request }) => {
    const res = await request.get("/api/feng-shui?room=LIVING&benefit=WEALTH");
    expect(res.status()).toBe(200);
    const list = await res.json();
    expect(list.map((t: { slug: string }) => t.slug).sort()).toEqual(["monstera", "pachira", "syngonium"]);
    const m = list.find((t: { slug: string }) => t.slug === "monstera");
    expect(m).toMatchObject({ name: "มอนสเตอร่า", price: 129000, direction: "SE" });
    expect(m.reason.length).toBeGreaterThan(10);
  });
  test("ชื่อตาม ?locale=en", async ({ request }) => {
    const list = await (await request.get("/api/feng-shui?room=LIVING&benefit=WEALTH&locale=en")).json();
    expect(list.find((t: { slug: string }) => t.slug === "monstera").name).toBe("Monstera");
  });
  test("ไม่มีต้นที่ตรง → [] ไม่ error", async ({ request }) => {
    const res = await request.get("/api/feng-shui?room=LIVING&benefit=LOVE");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });
  for (const q of ["", "?room=LIVING", "?benefit=WEALTH", "?room=GARAGE&benefit=WEALTH", "?room=LIVING&benefit=WEALTH&locale=fr"]) {
    test(`400 VALIDATION_ERROR: ${q || "ไม่มี query"}`, async ({ request }) => {
      const res = await request.get(`/api/feng-shui${q}`);
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBe("VALIDATION_ERROR");
    });
  }
});

test.describe("หน้า /feng-shui (US-10)", () => {
  test("เลือกห้องนั่งเล่น + การเงิน แล้วได้ต้นไม้พร้อมทิศ เหตุผล และข้อความตามความเชื่อ", async ({ page }) => {
    await page.goto("/th/feng-shui");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("fengshui-result")).toHaveCount(0);
    await page.getByTestId("fengshui-room").getByText("ห้องนั่งเล่น").click();
    await page.getByTestId("fengshui-benefit").getByText("การเงิน").click();
    await page.getByRole("button", { name: "ดูคำแนะนำ" }).click();

    await expect(page).toHaveURL(/room=LIVING&benefit=WEALTH/);
    const results = page.getByTestId("fengshui-result");
    await expect(results).toHaveCount(3);
    await expect(results.filter({ hasText: "มอนสเตอร่า" })).toContainText("ทิศตะวันออกเฉียงใต้");
    await expect(page.getByText("คำแนะนำตามความเชื่อ เพื่อความสบายใจ")).toBeVisible();
    await results.filter({ hasText: "มอนสเตอร่า" }).getByRole("link").first().click();
    await expect(page).toHaveURL(/\/th\/trees\/monstera$/);
  });

  test("ลิงก์ที่มี query แสดงผลทันที และตัวเลือกถูกเลือกไว้", async ({ page }) => {
    await page.goto("/en/feng-shui?room=OFFICE&benefit=CAREER");
    await expect(page.getByTestId("fengshui-result")).toHaveCount(3);
    await expect(page.getByTestId("fengshui-room").getByLabel("Office")).toBeChecked();
  });

  test("ไม่มีต้นที่ตรง: ข้อความแจ้ง ไม่ว่างเปล่า", async ({ page }) => {
    await page.goto("/th/feng-shui?room=LIVING&benefit=LOVE");
    await expect(page.getByTestId("fengshui-result")).toHaveCount(0);
    await expect(page.getByTestId("error-message")).toBeVisible();
  });

  test("ค่าใน URL ผิด: ไม่พัง ถือว่ายังไม่เลือก", async ({ page }) => {
    await page.goto("/th/feng-shui?room=GARAGE&benefit=%00");
    await expect(page.getByTestId("fengshui-room")).toBeVisible();
    await expect(page.getByTestId("fengshui-result")).toHaveCount(0);
  });

  test("สลับภาษาแล้วอยู่หน้าเดิมและคงตัวเลือก", async ({ page }) => {
    await page.goto("/th/feng-shui?room=LIVING&benefit=WEALTH");
    await page.getByTestId("lang-switch").click();
    await expect(page).toHaveURL(/\/en\/feng-shui\?room=LIVING&benefit=WEALTH/);
    await expect(page.locator('[data-testid="fengshui-result"]:visible')).toHaveCount(3);
  });
});
