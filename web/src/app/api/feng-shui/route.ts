import { NextResponse, type NextRequest } from "next/server";
import { apiError, parseLocale } from "@/lib/api";
import { getFengShuiPicks } from "@/lib/catalog";
import { parseFengShuiQuery } from "@/rules/feng-shui";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const locale = parseLocale(sp);
  if (!locale) return apiError(400, "VALIDATION_ERROR");
  const { room, benefit } = parseFengShuiQuery(Object.fromEntries(sp));
  if (!room || !benefit) return apiError(400, "VALIDATION_ERROR", locale);
  const picks = await getFengShuiPicks(room, benefit, locale);
  return NextResponse.json(picks.map(({ id, slug, name, price, stock, direction, reason }) => ({ id, slug, name, price, stock, direction, reason })));
}
