import { expect, test } from "@playwright/test";
import { tc } from "./helpers";

// [D] seed: ห้อง|เรื่อง → [ต้น:ทิศ] ที่เปิดขาย (24 ชุดที่เหลือต้องว่าง)
const SEED: Record<string, Record<string, string>> = {
  "LIVING|WEALTH": { monstera: "SE", pachira: "SE", syngonium: "SE" },
  "LIVING|HEALTH": { "lucky-bamboo": "E" },
  "LIVING|CAREER": { "fiddle-leaf-fig": "S" },
  "BEDROOM|HEALTH": { "snake-plant": "E" },
  "BEDROOM|LOVE": { orchid: "SW", "peace-lily": "SW" },
  "OFFICE|CAREER": { pachira: "SE", "rubber-plant": "N", "zz-plant": "NE" },
  "KITCHEN|HEALTH": { "holy-basil": "E", mint: "E" },
  "ENTRANCE|WEALTH": { "jade-plant": "SE", "zz-plant": "E" },
  "BALCONY|HEALTH": { "areca-palm": "E", "lime-tree": "S" },
};
const ROOMS = ["LIVING", "BEDROOM", "OFFICE", "KITCHEN", "ENTRANCE", "BALCONY"];
const BENEFITS = ["WEALTH", "HEALTH", "LOVE", "CAREER"];

tc("TC-FS-01", "API ครบทุกชุด 6 ห้อง × 4 เรื่อง = 24 ชุด ตรงข้อมูล seed", { level: "P1", section: "5.5", expected: "9 ชุดมีต้นไม้และทิศตามตาราง seed · อีก 15 ชุดได้ [] · ทุกรายการมี reason ไม่ว่าง", source: "[D] seed FengShui (spec F4 ห้อง × เรื่อง) · partition: ชุดที่มีข้อมูล / ไม่มีข้อมูล" }, async ({ request }) => {
  for (const room of ROOMS) for (const benefit of BENEFITS) {
    const r = await request.get(`/api/feng-shui?room=${room}&benefit=${benefit}`);
    expect.soft(r.status(), `${room}/${benefit}`).toBe(200);
    const list: { slug: string; direction: string; reason: string }[] = await r.json();
    const want = SEED[`${room}|${benefit}`] ?? {};
    expect.soft(Object.fromEntries(list.map((t) => [t.slug, t.direction])), `${room}/${benefit}`).toEqual(want);
    for (const t of list) expect.soft(t.reason.length, `${room}/${benefit}/${t.slug}`).toBeGreaterThan(0);
  }
});

tc("TC-FS-02", "API ตรวจ input: ขาด/ผิด/ตัวพิมพ์เล็ก → 400", { level: "P1", section: "5.5", expected: "ไม่มี query, มีแค่ room, มีแค่ benefit, ห้อง GARAGE, 'living', locale=fr → 400 VALIDATION_ERROR", source: "[D] spec ข้อ 13.3 + F4 (ห้อง 6 แบบ เรื่อง 4 แบบ)" }, async ({ request }) => {
  for (const q of ["", "?room=LIVING", "?benefit=WEALTH", "?room=GARAGE&benefit=WEALTH", "?room=living&benefit=WEALTH", "?room=LIVING&benefit=WEALTH&locale=fr"]) {
    const r = await request.get(`/api/feng-shui${q}`);
    expect.soft(r.status(), q).toBe(400);
    expect.soft((await r.json()).error, q).toBe("VALIDATION_ERROR");
  }
});

tc("TC-FS-03", "หน้า: ห้องนั่งเล่น + การเงิน → 3 ต้น ทิศตะวันออกเฉียงใต้ พร้อมข้อความตามความเชื่อ", { level: "P1", section: "5.5", expected: "3 ผลลัพธ์ (มอนสเตอร่า พาชีร่า เงินไหลมา) ทุกอันระบุ 'ทิศตะวันออกเฉียงใต้' · มีข้อความ 'คำแนะนำตามความเชื่อ เพื่อความสบายใจ'", source: "[D] spec ข้อ 12 (ห้องนั่งเล่น + การเงิน) + seed LIVING|WEALTH · BR-10" }, async ({ page }) => {
  await page.goto("/th/feng-shui");
  await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
  await page.getByTestId("fengshui-room").getByText("ห้องนั่งเล่น").click();
  await page.getByTestId("fengshui-benefit").getByText("การเงิน").click();
  await page.getByRole("button", { name: "ดูคำแนะนำ" }).click();
  const results = page.getByTestId("fengshui-result");
  await expect(results).toHaveCount(3);
  for (const name of ["มอนสเตอร่า", "พาชีร่า", "เงินไหลมา"]) await expect.soft(results.filter({ hasText: name })).toContainText("ทิศตะวันออกเฉียงใต้");
  await expect.soft(page.getByText("คำแนะนำตามความเชื่อ เพื่อความสบายใจ")).toBeVisible();
});

tc("TC-FS-04", "หน้า: ชุดที่ไม่มีข้อมูล แจ้งข้อความ ไม่ใช่หน้าว่าง", { level: "P2", section: "5.5", expected: "ห้องนั่งเล่น + ความรัก → ไม่มีผลลัพธ์ และเห็น error-message", source: "[D] seed ไม่มี LIVING|LOVE · [R] ไม่พบต้องบอกผู้ใช้" }, async ({ page }) => {
  await page.goto("/th/feng-shui?room=LIVING&benefit=LOVE");
  await expect.soft(page.getByTestId("fengshui-result")).toHaveCount(0);
  await expect.soft(page.getByTestId("error-message")).toBeVisible();
});

tc("TC-FS-05", "หน้า: ค่าใน URL ผิด/อักขระแปลก ไม่พัง และตัวเลือกคงอยู่เมื่อสลับภาษา", { level: "P2", section: "5.5", expected: "room=GARAGE ไม่มีผลลัพธ์ · room=<script> ไม่ทำงาน · สลับไป /en คง ?room=OFFICE&benefit=CAREER และมี 3 ผลลัพธ์", source: "[R] ข้อมูลจาก URL เชื่อไม่ได้ · [D] seed OFFICE|CAREER = 3 ต้น · spec ข้อ 9.1" }, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/th/feng-shui?room=GARAGE&benefit=WEALTH");
  await expect.soft(page.getByTestId("fengshui-result")).toHaveCount(0);
  await page.goto("/th/feng-shui?room=%3Cscript%3Ealert(1)%3C/script%3E&benefit=%00");
  await expect.soft(page.getByTestId("fengshui-room")).toBeVisible();
  await page.goto("/th/feng-shui?room=OFFICE&benefit=CAREER");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/en\/feng-shui\?room=OFFICE&benefit=CAREER/);
  await expect.soft(page.locator('[data-testid="fengshui-result"]:visible')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test.describe("ทางเข้า", () => {
  tc("TC-FS-06", "หน้าแรกมีทางไป /feng-shui", { level: "P3", section: "5.5", expected: "กดปุ่มบนหน้าแรกแล้วไป /th/feng-shui", source: "[D] spec F4 ทางเข้า" }, async ({ page }) => {
    await page.goto("/th");
    await page.getByTestId("home-feng-shui").click();
    await expect(page).toHaveURL(/\/th\/feng-shui$/);
  });
});
