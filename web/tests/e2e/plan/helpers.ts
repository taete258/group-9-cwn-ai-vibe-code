import { test, type APIRequestContext, type Locator, type PlaywrightTestArgs, type PlaywrightTestOptions, type TestInfo } from "@playwright/test";

type Meta = { level: "P1" | "P2" | "P3"; section: string; expected: string; source: string };

// 1 test = 1 test case: ชื่อขึ้นต้นด้วย ID, tag ระดับ+หัวข้อ, ผลที่คาดหวังและที่มาอยู่ใน annotation (ตาม TEST-PLAN.md)
export const tc = (id: string, title: string, m: Meta, fn: (args: PlaywrightTestArgs & PlaywrightTestOptions, info: TestInfo) => Promise<void>) =>
  test(`${id} ${title}`, { tag: [`@${m.level}`, `@${m.section}`], annotation: [{ type: "ผลที่คาดหวัง", description: m.expected }, { type: "ที่มา", description: m.source }] }, fn);

// ไฮไลต์ element ที่กำลังตรวจด้วยกรอบแดง (ไว้ดูตอนอัดวิดีโอ/ภาพ)
export const hl = async (l: Locator) => {
  await l.first().evaluate((e) => ((e as HTMLElement).style.outline = "3px solid red")).catch(() => {});
  return l;
};

export const idOf = async (request: APIRequestContext, slug: string) => (await (await request.get(`/api/trees/${slug}`)).json()).id as number;

// oracle ของยอดเงิน เขียนแยกเองจาก spec ข้อ 4 (ห้ามเรียกฟังก์ชันของเว็บ): หน่วยสตางค์
export function oracle(subtotal: number) {
  const shippingFee = subtotal >= 100000 ? 0 : 6000;
  const total = subtotal + shippingFee;
  const vat = Math.round((total * 7) / 107);
  return { subtotal, shippingFee, total, vat, net: total - vat, freeShippingRemaining: Math.max(0, 100000 - subtotal) };
}
export const baht = (satang: number) => `฿${(satang / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ข้อมูลทดสอบ [D]: ราคาเป็นสตางค์ และ stock ตาม seed (TEST-PLAN.md หัวข้อ 7)
export const T = {
  monstera: { price: 129000, stock: 5 }, "zz-plant": { price: 45000, stock: 8 }, syngonium: { price: 32000, stock: 12 },
  "lucky-bamboo": { price: 19000, stock: 20 }, pachira: { price: 89000, stock: 3 }, "fiddle-leaf-fig": { price: 145000, stock: 0 },
  "holy-basil": { price: 9000, stock: 30 }, mint: { price: 12000, stock: 16 }, tomato: { price: 19000, stock: 1 },
  "mango-tree": { price: 240000, stock: 2 }, "peace-lily": { price: 49000, stock: 7 },
} as const;

// ราคาต้นไม้ที่เปิดขายทั้ง 20 ต้น (สตางค์) ไว้เป็น oracle ของการเรียงลำดับ
export const ALL_PRICES = [129000, 45000, 32000, 19000, 25000, 89000, 145000, 89000, 39000, 49000, 25000, 22000, 49000, 25000, 9000, 19000, 12000, 240000, 59000, 145000];
export const parseBaht = (s: string) => Math.round(Number(s.replace(/[^\d.]/g, "")) * 100);
export const cartItem = (slug: keyof typeof T, treeId: number, quantity: number) => ({ treeId, slug, nameTh: slug, nameEn: slug, image: null, price: T[slug].price, stock: T[slug].stock, quantity });
