import { NextResponse } from "next/server";
import { z } from "zod";
import type { Locale } from "@/rules/localize";

const localeSchema = z.enum(["th", "en"]);

// ?locale= ค่าเริ่มต้น th; ค่าไม่รู้จัก → null (ผู้เรียกตอบ 400)
export function parseLocale(sp: URLSearchParams): Locale | null {
  const raw = sp.get("locale");
  if (raw === null) return "th";
  const r = localeSchema.safeParse(raw);
  return r.success ? r.data : null;
}

const MESSAGES = {
  VALIDATION_ERROR: { th: "ข้อมูลที่ส่งมาไม่ถูกต้อง", en: "Invalid input" },
  NOT_FOUND: { th: "ไม่พบข้อมูล", en: "Not found" },
} as const;

// รูปแบบ error ตามสัญญา: { error: CODE, message } (test เทียบเฉพาะ error)
export function apiError(status: number, code: keyof typeof MESSAGES, locale: Locale = "th") {
  return NextResponse.json({ error: code, message: MESSAGES[code][locale] }, { status });
}
