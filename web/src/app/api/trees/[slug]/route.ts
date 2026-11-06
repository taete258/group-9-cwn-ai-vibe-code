import { NextResponse, type NextRequest } from "next/server";
import { apiError, parseLocale } from "@/lib/api";
import { getTreeBySlug } from "@/lib/catalog";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/trees/[slug]">) {
  const locale = parseLocale(request.nextUrl.searchParams);
  if (!locale) return apiError(400, "VALIDATION_ERROR");
  const tree = await getTreeBySlug((await ctx.params).slug, locale);
  if (!tree) return apiError(404, "NOT_FOUND", locale);
  // related ตามสัญญา = รูปแบบเดียวกับ /api/trees; relatedCollection ใช้เฉพาะหน้าเว็บ
  const { relatedCollection, related, ...rest } = tree;
  void relatedCollection;
  return NextResponse.json({ ...rest, related: related.map(({ id, slug, name, price, stock, size, species }) => ({ id, slug, name, price, stock, size, species })) });
}
