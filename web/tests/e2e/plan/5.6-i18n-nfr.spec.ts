import { expect, test } from "@playwright/test";
import { tc } from "./helpers";

const PAGES = ["/th", "/th/trees", "/th/trees/monstera", "/th/trees/mint", "/th/feng-shui", "/th/cart"];

tc("TC-I18N-01", "สลับภาษาที่หน้ารายละเอียด: อยู่หน้าเดิม เนื้อหาเปลี่ยน ราคาเท่าเดิม", { level: "P1", section: "5.6", expected: "/th/trees/monstera → /en/trees/monstera, h1 'Monstera', ราคา ฿1,290.00 เหมือนเดิม, ฮวงจุ้ย 'Living room'", source: "[D] spec ข้อ 9.1 + ข้อ 12 · seed monstera" }, async ({ page }) => {
  await page.goto("/th/trees/monstera");
  await page.getByTestId("lang-switch").click();
  await expect(page).toHaveURL(/\/en\/trees\/monstera$/);
  const visible = (id: string) => page.locator(`[data-testid="${id}"]:visible`);
  await expect.soft(page.getByRole("heading", { level: 1, name: "Monstera" })).toBeVisible();
  await expect.soft(visible("tree-price")).toHaveText("฿1,290.00");
  await expect.soft(visible("feng-shui-box")).toContainText("Living room");
});

tc("TC-I18N-02", "ไม่มีข้อความไทยหลงในหน้า /en (ยกเว้นปุ่มสลับภาษาและช่องชื่อไทย)", { level: "P1", section: "5.6", expected: "ทุกหน้า /en ไม่พบอักษรไทย (ไม่นับ ฿)", source: "[D] spec ข้อ 12 + FR-019 (ข้อยกเว้น 2 ข้อ)" }, async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p.replace("/th", "/en"));
    await expect(page.locator("main")).toBeVisible();
    await page.evaluate(() => document.querySelectorAll('[data-testid="plant-names"]').forEach((e) => e.remove()));
    const text = (await page.locator("body").innerText()).replace(/฿|ภาษาไทย/g, "");
    expect.soft(text.match(/[฀-๿]+/g) ?? [], p).toEqual([]);
  }
});

tc("TC-I18N-03", "ภาษาเริ่มต้น: Accept-Language en → /en, ไม่ระบุ → /th, cookie ชนะ header", { level: "P2", section: "5.6", expected: "ขอ / พร้อม accept-language: en → 307 /en · ไม่มี header → /th · cookie NEXT_LOCALE=en + accept-language th → /en", source: "[D] spec ข้อ 9.1 ลำดับ: cookie → Accept-Language → ไทย" }, async ({ request }) => {
  const go = async (headers: Record<string, string>) => {
    const r = await request.get("/", { headers, maxRedirects: 0 });
    return r.headers()["location"];
  };
  expect.soft(await go({ "accept-language": "en" })).toMatch(/\/en$/);
  expect.soft(await go({ "accept-language": "" })).toMatch(/\/th$/);
  expect.soft(await go({ cookie: "NEXT_LOCALE=en", "accept-language": "th" })).toMatch(/\/en$/);
});

tc("TC-I18N-04", "API ?locale: ชื่อตามภาษา ค่าเริ่มต้นไทย ค่าไม่รู้จัก 400", { level: "P2", section: "5.6", expected: "ไม่ส่ง locale → 'มอนสเตอร่า' · locale=en → 'Monstera' · locale=fr → 400", source: "[D] spec ข้อ 9.1 API รับ ?locale=th|en ค่าเริ่มต้น th" }, async ({ request }) => {
  const name = async (q: string) => (await (await request.get(`/api/trees/monstera${q}`)).json()).name;
  expect.soft(await name("")).toBe("มอนสเตอร่า");
  expect.soft(await name("?locale=en")).toBe("Monstera");
  expect.soft((await request.get("/api/trees/monstera?locale=fr")).status()).toBe(400);
});

tc("TC-I18N-05", "prefix ภาษาที่ไม่รองรับหรือ path ที่ไม่มี แสดงหน้าไม่พบในเว็บ", { level: "P2", section: "5.6", expected: "/fr/trees และ /th/nope เห็นข้อความ 'ไม่พบหน้านี้' หรือ 'Page not found' พร้อมหัวเว็บ", source: "[R] ต้องมีหน้าแจ้งเมื่อ URL ผิด · spec ข้อ 9.1 URL มี prefix th/en เท่านั้น" }, async ({ page }) => {
  for (const p of ["/fr/trees", "/th/nope"]) {
    await page.goto(p);
    await expect.soft(page.getByText(/ไม่พบหน้านี้|Page not found/)).toBeVisible();
    await expect.soft(page.getByTestId("lang-switch")).toBeVisible();
  }
});

tc("TC-NFR-01", "มือถือ 375px: ไม่มีการเลื่อนแนวนอนทุกหน้า", { level: "P2", section: "5.6", expected: "scrollWidth − clientWidth = 0 ทุกหน้า (รวมหน้าที่มีผลกรอง/ผลฮวงจุ้ย)", source: "[D] spec ข้อ 9 Responsive 375px" }, async ({ page }) => {
  for (const p of [...PAGES, "/th/trees?collection=lucky", "/th/feng-shui?room=LIVING&benefit=WEALTH", "/en/trees/monstera"]) {
    await page.goto(p);
    await expect(page.locator("main")).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect.soft(over, p).toBe(0);
  }
});

tc("TC-NFR-02", "ไม่มี JavaScript error ใน console ทุกหน้า", { level: "P2", section: "5.6", expected: "ไม่มี console.error และ pageerror", source: "[R] หน้าที่ปกติไม่ควรมี error" }, async ({ page }) => {
  const errs: string[] = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push(e.message));
  for (const p of [...PAGES, "/en", "/th/trees/fiddle-leaf-fig"]) {
    await page.goto(p, { waitUntil: "networkidle" });
  }
  expect(errs).toEqual([]);
});

tc("TC-NFR-03", "รูปทุกรูปที่เห็นมี alt และโหลดสำเร็จ", { level: "P3", section: "5.6", expected: "ทุก <img> ที่มองเห็นมี alt ไม่ว่าง (ยกเว้นรูปย่อที่ตกแต่ง) และ naturalWidth > 0", source: "[R] WCAG 1.1.1 · spec ข้อ 9 รูปผ่าน next/image" }, async ({ page }) => {
  for (const p of ["/th", "/th/trees", "/th/trees/monstera"]) {
    await page.goto(p, { waitUntil: "networkidle" });
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("img")].filter((i) => i.offsetParent !== null && !i.closest('[data-testid="gallery-thumb"]'))
        .filter((i) => !i.alt.trim() || (i.complete && i.naturalWidth === 0)).map((i) => i.src));
    expect.soft(bad, p).toEqual([]);
  }
});

tc("TC-NFR-04", "<html lang> ตรงกับภาษาของ URL และมี hreflang เทียบเท่า", { level: "P3", section: "5.6", expected: "/th → lang=th, /en → lang=en · header Link มี hreflang=th และ hreflang=en", source: "[D] spec ข้อ 9.1 SEO" }, async ({ page, request }) => {
  await page.goto("/th");
  await expect.soft(page.locator("html")).toHaveAttribute("lang", "th");
  await page.goto("/en");
  await expect.soft(page.locator("html")).toHaveAttribute("lang", "en");
  const link = (await request.get("/th/trees/monstera")).headers()["link"] ?? "";
  expect.soft(link).toContain('hreflang="th"');
  expect.soft(link).toContain('hreflang="en"');
});

tc("TC-NFR-05", "⚠️ ชื่อแท็บ (title) ควรต่างกันตามหน้า", { level: "P3", section: "5.6", expected: "หน้ารายละเอียดมอนสเตอร่ามี title ที่มีชื่อสินค้า ไม่ใช่ 'Tree Shop' เฉย ๆ", source: "[R] กฎทั่วไป SEO/การเข้าถึง: title ระบุหน้า · [O] ทุกหน้าได้ 'Tree Shop'" }, async ({ page }) => {
  test.fail(true, "triage: เว็บผิด — ใช้ metadata.title เดียวทั้งเว็บ (ยังไม่มี generateMetadata รายหน้า)");
  await page.goto("/th/trees/monstera");
  await expect(page).toHaveTitle(/มอนสเตอร่า|Monstera/);
});

tc("TC-NFR-06", "⚠️ URL ที่ไม่มีอยู่ต้องตอบสถานะ 404", { level: "P3", section: "5.6", expected: "GET /th/nope → HTTP 404", source: "[R] กฎทั่วไปของเว็บ · [O] ตอบ 200 (soft 404)" }, async ({ request }) => {
  test.fail(true, "triage: เว็บผิด — catch-all page เรียก notFound() หลังเริ่ม stream จึงได้ 200");
  expect((await request.get("/th/nope")).status()).toBe(404);
});
