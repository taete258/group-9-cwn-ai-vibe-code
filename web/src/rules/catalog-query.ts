import { z } from "zod";

export const SIZES = ["S", "M", "L"] as const;
export const SPECIES = ["FOLIAGE", "FLOWERING", "SUCCULENT", "FRUIT", "HERB"] as const;
export const CARES = ["EASY", "MEDIUM", "HARD"] as const;
export const SORTS = ["newest", "price_asc", "price_desc"] as const;

export type CatalogQuery = {
  collection?: string;
  size?: (typeof SIZES)[number];
  species?: (typeof SPECIES)[number];
  care?: (typeof CARES)[number];
  petSafe: boolean;
  q?: string;
  sort: (typeof SORTS)[number];
};

type Input = Record<string, string | string[] | undefined>;
export type ParseResult = { ok: true; query: CatalogQuery } | { ok: false; error: "VALIDATION_ERROR" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const schemas = {
  size: z.enum(SIZES),
  species: z.enum(SPECIES),
  care: z.enum(CARES),
  sort: z.enum(SORTS),
};

// strict = API (ค่าผิด → VALIDATION_ERROR), ไม่ strict = หน้าเว็บ (ละเลยค่าผิดเป็นรายตัว ตาม FR-009)
export function parseCatalogQuery(input: Input, { strict }: { strict: boolean }): ParseResult {
  const query: CatalogQuery = { petSafe: first(input.petSafe) === "1", sort: "newest" };

  for (const key of ["size", "species", "care", "sort"] as const) {
    const raw = first(input[key]);
    if (raw === undefined || raw === "") continue;
    const parsed = schemas[key].safeParse(raw);
    if (parsed.success) (query as Record<string, unknown>)[key] = parsed.data;
    else if (strict) return { ok: false, error: "VALIDATION_ERROR" };
  }

  const collection = first(input.collection)?.trim();
  if (collection) query.collection = collection;
  const q = first(input.q)?.trim();
  // คำค้นที่ไม่มีตัวอักษร/ตัวเลขเลย (ช่องว่าง, % _ ' ! ฯลฯ) ถือว่าไม่ได้ค้นหา (spec Edge Cases)
  if (q && /[\p{L}\p{N}]/u.test(q)) query.q = q;

  return { ok: true, query };
}
