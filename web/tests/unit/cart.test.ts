import { describe, expect, it } from "vitest";
import { buildQuote } from "@/rules/cart";

const line = (treeId: number, unitPrice: number, quantity: number, stock = 99) => ({ treeId, slug: `t${treeId}`, unitPrice, quantity, stock });

describe("buildQuote (spec ข้อ 4 / 13.4)", () => {
  it("890 บาท → ค่าส่ง 60, total 950, vat 6215, net 88785", () => {
    const q = buildQuote([line(1, 89000, 1)]);
    expect(q).toMatchObject({ subtotal: 89000, shippingFee: 6000, total: 95000, vat: 6215, net: 88785, freeShippingRemaining: 11000 });
  });
  it("1,000 บาทส่งฟรี (>=) และ 999.99 ยังคิดค่าส่ง", () => {
    expect(buildQuote([line(1, 100000, 1)])).toMatchObject({ shippingFee: 0, freeShippingRemaining: 0, total: 100000 });
    expect(buildQuote([line(1, 99999, 1)]).shippingFee).toBe(6000);
  });
  it("amount = unitPrice × quantity, subtotal = ผลรวม", () => {
    const q = buildQuote([line(3, 45000, 1), line(7, 22250, 2)]);
    expect(q.lines.map((l) => l.amount)).toEqual([45000, 44500]);
    expect(q).toMatchObject({ subtotal: 89500, total: 95500, vat: 6248, net: 89252 });
  });
  it("vat ปัดครั้งเดียวที่ยอดสุทธิ (100000×7/107 = 6542.06 → 6542)", () => {
    expect(buildQuote([line(1, 100000, 1)])).toMatchObject({ vat: 6542, net: 93458 });
  });
  it("เตือนเมื่อสินค้าหมด/เกิน stock และไม่ตัดจำนวนของ line", () => {
    const q = buildQuote([line(1, 1000, 2, 0), line(2, 1000, 3, 1), line(3, 1000, 1, 5)]);
    expect(q.warnings).toEqual([
      { treeId: 1, code: "OUT_OF_STOCK" },
      { treeId: 2, code: "INSUFFICIENT_STOCK", available: 1 },
    ]);
    expect(q.lines[1].quantity).toBe(3);
  });
});
