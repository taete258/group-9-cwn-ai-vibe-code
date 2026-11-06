import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { buildQuote } from "@/rules/cart";

// oracle เขียนแยกเองจาก spec ข้อ 4 (ไม่ใช้ค่าคงที่/ฟังก์ชันจาก src/rules/cart.ts): สตางค์ทั้งหมด
const oracle = (subtotal: number) => {
  const ship = subtotal >= 100000 ? 0 : 6000;
  const total = subtotal + ship;
  const vat = Math.round((total * 7) / 107);
  return { ship, total, vat, net: total - vat, remaining: Math.max(0, 100000 - subtotal) };
};

const line = fc.record({
  treeId: fc.integer({ min: 1, max: 999 }),
  slug: fc.constantFrom("a", "b", "c"),
  unitPrice: fc.integer({ min: 100, max: 500000 }), // ฿1 – ฿5,000 ต่อชิ้น
  quantity: fc.integer({ min: 1, max: 50 }),
  stock: fc.integer({ min: 0, max: 60 }),
});
const cart = fc.uniqueArray(line, { selector: (l) => l.treeId, minLength: 1, maxLength: 8 }); // treeId ไม่ซ้ำ (API รวมบรรทัดซ้ำก่อนคำนวณ)
const runs = { numRuns: 1000 };
const sub = (items: { unitPrice: number; quantity: number }[]) => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

describe("buildQuote — property (1,000 ตะกร้าสุ่มต่อข้อ)", () => {
  it("P1 ทุกช่องตรง oracle", () => {
    fc.assert(fc.property(cart, (items) => {
      const q = buildQuote(items);
      const o = oracle(sub(items));
      expect([q.subtotal, q.shippingFee, q.total, q.vat, q.net, q.freeShippingRemaining]).toEqual([sub(items), o.ship, o.total, o.vat, o.net, o.remaining]);
    }), runs);
  });

  it("P2 ผลรวมต้องสอดคล้อง: total = subtotal + ค่าส่ง, vat + net = total, amount = ราคา×จำนวน", () => {
    fc.assert(fc.property(cart, (items) => {
      const q = buildQuote(items);
      expect(q.total).toBe(q.subtotal + q.shippingFee);
      expect(q.vat + q.net).toBe(q.total);
      q.lines.forEach((l, i) => expect(l.amount).toBe(items[i].unitPrice * items[i].quantity));
    }), runs);
  });

  it("P3 ค่าส่ง: 0 เมื่อ subtotal >= ฿1,000 ไม่เช่นนั้น ฿60 (ขอบ 99,999 / 100,000 / 100,001)", () => {
    fc.assert(fc.property(fc.integer({ min: 99_990, max: 100_010 }), (price) => {
      expect(buildQuote([{ treeId: 1, slug: "a", unitPrice: price, quantity: 1, stock: 9 }]).shippingFee).toBe(price >= 100_000 ? 0 : 6000);
    }), runs);
  });

  it("P4 VAT ใกล้ 7/107 ของยอดสุทธิไม่เกินครึ่งสตางค์ (ปัดครั้งเดียว)", () => {
    fc.assert(fc.property(cart, (items) => {
      const q = buildQuote(items);
      expect(Math.abs(q.vat * 107 - q.total * 7)).toBeLessThanOrEqual(53.5);
    }), runs);
  });

  it("P5 [metamorphic] สลับลำดับรายการ ผลสรุปต้องเท่าเดิม", () => {
    fc.assert(fc.property(cart, (items) => {
      const a = buildQuote(items);
      const b = buildQuote([...items].reverse());
      expect({ ...a, lines: undefined, warnings: undefined }).toEqual({ ...b, lines: undefined, warnings: undefined });
    }), runs);
  });

  it("P6 [metamorphic] เพิ่มจำนวนสินค้า ยอดรวมสินค้า (subtotal) ไม่ลด แต่ยอดสุทธิอาจลดได้เมื่อข้ามเกณฑ์ส่งฟรี", () => {
    fc.assert(fc.property(cart, fc.integer({ min: 0, max: 7 }), (items, k) => {
      const i = k % items.length;
      const more = items.map((x, j) => (j === i ? { ...x, quantity: x.quantity + 1 } : x));
      expect(buildQuote(more).subtotal).toBeGreaterThan(buildQuote(items).subtotal);
    }), runs);
    // กรณีที่ total ลดลงจริง: 99,999 (+6000 = 105,999) → 100,000 ส่งฟรี total = 100,000
    const t = (p: number) => buildQuote([{ treeId: 1, slug: "a", unitPrice: p, quantity: 1, stock: 9 }]).total;
    expect(t(100_000)).toBeLessThan(t(99_999));
  });

  it("P7 คำเตือน stock: หมด iff stock = 0, ไม่พอ iff 0 < stock < quantity (ไม่เตือนที่ quantity = stock)", () => {
    fc.assert(fc.property(cart, (items) => {
      const w = buildQuote(items).warnings;
      for (const i of items) {
        const mine = w.filter((x) => x.treeId === i.treeId);
        if (i.stock === 0) expect(mine.some((x) => x.code === "OUT_OF_STOCK")).toBe(true);
        else if (i.quantity > i.stock) expect(mine.some((x) => x.code === "INSUFFICIENT_STOCK" && "available" in x && x.available === i.stock)).toBe(true);
        else expect(mine).toEqual([]); // quantity <= stock (รวมขอบ quantity = stock) ต้องไม่เตือน
      }
    }), runs);
  });
});
