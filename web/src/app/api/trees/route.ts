import { NextResponse, type NextRequest } from "next/server";
import { apiError, parseLocale } from "@/lib/api";
import { listTrees } from "@/lib/catalog";
import { parseCatalogQuery } from "@/rules/catalog-query";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const locale = parseLocale(sp);
  if (!locale) return apiError(400, "VALIDATION_ERROR");
  const parsed = parseCatalogQuery(Object.fromEntries(sp), { strict: true });
  if (!parsed.ok) return apiError(400, parsed.error, locale);
  const trees = await listTrees(parsed.query, locale);
  // รูปแบบตามสัญญา 13.3 (ไม่มี image ของการ์ด)
  return NextResponse.json(trees.map(({ id, slug, name, price, stock, size, species }) => ({ id, slug, name, price, stock, size, species })));
}
