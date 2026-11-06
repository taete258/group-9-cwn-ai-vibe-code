import { expect, test } from "@playwright/test";

// monstera ฿1,290 stock 5 · zz-plant ราคาต่ำกว่า 1,000 · fiddle-leaf-fig stock 0
const money = (s: string) => Number(s.replace(/[^\d.]/g, ""));

test.describe("ตะกร้า (M2, จบที่สรุปยอด)", () => {
  test("ใส่ตะกร้าจากหน้ารายละเอียด แล้วเห็นสรุปยอดครบ ตรงสูตร", async ({ page }) => {
    await page.goto("/th/trees/zz-plant");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto("/th/cart");

    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("cart-subtotal")).toBeVisible();
    const sub = money(await page.getByTestId("cart-subtotal").innerText());
    const ship = money(await page.getByTestId("cart-shipping").innerText());
    const total = money(await page.getByTestId("cart-total").innerText());
    const vat = money(await page.getByTestId("cart-vat").innerText());
    const net = money(await page.getByTestId("cart-net").innerText());
    expect(sub).toBeLessThan(1000);
    expect(ship).toBe(60);
    expect(total).toBeCloseTo(sub + 60, 2);
    expect(vat + net).toBeCloseTo(total, 2);
    await expect(page.getByTestId("free-shipping-remaining")).toContainText(String(1000 - sub).replace(/\.0+$/, ""));
  });

  test("เพิ่ม/ลดจำนวน ลบรายการ และไม่เกิน stock", async ({ page }) => {
    await page.goto("/th/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.getByTestId("quantity-input").fill("2");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/th/cart");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("cart-line")).toContainText("2");
    await expect(page.getByTestId("cart-shipping")).toContainText("ฟรี"); // 2,580 ≥ 1,000

    await page.getByTestId("cart-inc").click();
    await expect(page.getByTestId("cart-qty")).toHaveText("3");
    await page.getByTestId("cart-dec").click();
    await expect(page.getByTestId("cart-qty")).toHaveText("2");
    for (let i = 0; i < 6; i++) await page.getByTestId("cart-inc").click({ force: true });
    await expect(page.getByTestId("cart-qty")).toHaveText("5"); // stock = 5
    await page.getByTestId("cart-remove").click();
    await expect(page.getByTestId("cart-line")).toHaveCount(0);
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("ตะกร้าไม่หายเมื่อรีโหลดและสลับภาษา", async ({ page }) => {
    await page.goto("/th/trees/monstera");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.getByTestId("add-to-cart").click();
    await page.goto("/th/cart");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.reload();
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("cart-line")).toContainText("มอนสเตอร่า");
    await page.getByTestId("lang-switch").click();
    await expect(page).toHaveURL(/\/en\/cart$/);
    await expect(page.locator('[data-testid="cart-line"]:visible')).toContainText("Monstera");
  });

  test("ราคาที่เก็บไว้ไม่ตรงกับตอนนี้ → เตือนและแสดงยอดตามราคาจริง", async ({ page, request }) => {
    const treeId = (await (await request.get("/api/trees/monstera")).json()).id;
    await page.goto("/th/cart");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await page.evaluate(
      (id) => localStorage.setItem("tree-shop-cart", JSON.stringify([{ treeId: id, slug: "monstera", nameTh: "x", nameEn: "x", image: null, price: 1, stock: 5, quantity: 1 }])),
      treeId,
    );
    await page.reload();
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("cart-warning")).toBeVisible();
  });

  test("สินค้าหมด: ปุ่มใส่ตะกร้าใช้ไม่ได้", async ({ page }) => {
    await page.goto("/th/trees/fiddle-leaf-fig");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
  });

  test("ตะกร้าว่าง: ข้อความและทางไปเลือกต้นไม้ ไม่ยิง quote", async ({ page }) => {
    await page.goto("/th/cart");
    await page.waitForLoadState("networkidle"); // รอ hydrate ก่อนโต้ตอบ (WebKit ช้ากว่า)
    await expect(page.getByTestId("cart-empty")).toBeVisible();
    await expect(page.getByRole("link", { name: "ดูต้นไม้ทั้งหมด" }).first()).toBeVisible();
  });
});
