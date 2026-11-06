// สรุปยอดตะกร้า (spec ข้อ 4 / 13.4) — ฟังก์ชันเดียวที่ /api/cart/quote ใช้ เงินเป็นสตางค์ (constitution ข้อ I)
export const SHIPPING_FEE = 6000;
export const FREE_SHIPPING_AT = 100000;

export type QuoteInput = { treeId: number; slug: string; unitPrice: number; quantity: number; stock: number };
export type QuoteWarning = { treeId: number; code: "OUT_OF_STOCK" } | { treeId: number; code: "INSUFFICIENT_STOCK"; available: number };

export function buildQuote(items: QuoteInput[]) {
  const lines = items.map(({ treeId, slug, unitPrice, quantity }) => ({ treeId, slug, unitPrice, quantity, amount: unitPrice * quantity }));
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const vat = Math.floor((total * 7 * 2 + 107) / (107 * 2)); // round(total×7/107) half-up ด้วยจำนวนเต็มล้วน
  const warnings: QuoteWarning[] = [];
  for (const i of items) {
    if (i.stock === 0) warnings.push({ treeId: i.treeId, code: "OUT_OF_STOCK" });
    else if (i.quantity > i.stock) warnings.push({ treeId: i.treeId, code: "INSUFFICIENT_STOCK", available: i.stock });
  }
  return { lines, subtotal, shippingFee, total, vat, net: total - vat, freeShippingRemaining: Math.max(0, FREE_SHIPPING_AT - subtotal), warnings };
}
