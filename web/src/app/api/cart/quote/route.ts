import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, parseLocale } from "@/lib/api";
import { db } from "@/lib/db";
import { buildQuote } from "@/rules/cart";

const body = z.object({
  items: z.array(z.object({ treeId: z.number().int().positive(), quantity: z.number().int().min(1).max(999) })).min(1).max(100),
});

// ไม่บันทึกอะไร: อ่านราคา/stock จาก DB แล้วคำนวณใหม่ทุกครั้ง (constitution ข้อ II)
export async function POST(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams);
  if (!locale) return apiError(400, "VALIDATION_ERROR");
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", locale);

  const qty = new Map<number, number>(); // id ซ้ำ → รวมจำนวน
  for (const { treeId, quantity } of parsed.data.items) qty.set(treeId, (qty.get(treeId) ?? 0) + quantity);

  const trees = await db.tree.findMany({ where: { id: { in: [...qty.keys()] }, isActive: true }, select: { id: true, slug: true, price: true, stock: true } });
  if (trees.length !== qty.size) return apiError(404, "NOT_FOUND", locale);
  const byId = new Map(trees.map((t) => [t.id, t]));

  return NextResponse.json(buildQuote([...qty].map(([id, quantity]) => ({ treeId: id, slug: byId.get(id)!.slug, unitPrice: byId.get(id)!.price, quantity, stock: byId.get(id)!.stock }))));
}
