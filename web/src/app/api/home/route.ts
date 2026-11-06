import { NextResponse, type NextRequest } from "next/server";
import { apiError, parseLocale } from "@/lib/api";
import { getHomeRows } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams);
  if (!locale) return apiError(400, "VALIDATION_ERROR");
  return NextResponse.json({ rows: await getHomeRows(locale) });
}
