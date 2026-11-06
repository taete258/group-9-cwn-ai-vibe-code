export type Locale = "th" | "en";

type TreeRow = {
  id: number; slug: string; nameTh: string; nameEn: string;
  descriptionTh: string; descriptionEn: string;
  scientificName: string | null; originTh: string | null; originEn: string | null;
  species: string; size: string; careLevel: string;
  lightTh: string; lightEn: string; waterTh: string; waterEn: string;
  heightCm: number | null; potSizeInch: number | null; petSafe: boolean;
  price: number; stock: number; images: readonly string[];
};
type FengShuiRow = { room: string; direction: string; benefit: string; reasonTh: string; reasonEn: string };
type CollectionRow = { slug: string; nameTh: string; nameEn: string };

const pick = <T extends string>(locale: Locale, th: T, en: T): T => (locale === "th" ? th : en);

export function localizeTree(t: TreeRow, locale: Locale) {
  return {
    id: t.id, slug: t.slug,
    name: pick(locale, t.nameTh, t.nameEn),
    nameTh: t.nameTh, nameEn: t.nameEn, scientificName: t.scientificName,
    origin: locale === "th" ? t.originTh : t.originEn,
    description: pick(locale, t.descriptionTh, t.descriptionEn),
    price: t.price, stock: t.stock, size: t.size, species: t.species, careLevel: t.careLevel,
    light: pick(locale, t.lightTh, t.lightEn),
    water: pick(locale, t.waterTh, t.waterEn),
    heightCm: t.heightCm, potSizeInch: t.potSizeInch, petSafe: t.petSafe,
    images: [...t.images],
  };
}

// รูปแบบตามสัญญาข้อ 13.3 ของ spec.md ห้ามเปลี่ยน
export function toTreeSummary(t: Pick<TreeRow, "id" | "slug" | "nameTh" | "nameEn" | "price" | "stock" | "size" | "species">, locale: Locale) {
  return { id: t.id, slug: t.slug, name: pick(locale, t.nameTh, t.nameEn), price: t.price, stock: t.stock, size: t.size, species: t.species };
}

export function localizeFengShui(f: FengShuiRow, locale: Locale) {
  return { room: f.room, direction: f.direction, benefit: f.benefit, reason: pick(locale, f.reasonTh, f.reasonEn) };
}

export function localizeCollection(c: CollectionRow, locale: Locale) {
  return { key: c.slug, name: pick(locale, c.nameTh, c.nameEn) };
}

// การ์ดต้นไม้ = สรุปตามสัญญา 13.3 + รูปแรก (เพิ่มฟิลด์ได้ ห้ามเปลี่ยนของเดิม)
export function toTreeCard(t: Parameters<typeof toTreeSummary>[0] & { images: readonly string[] }, locale: Locale) {
  return { ...toTreeSummary(t, locale), image: t.images[0] ?? null };
}
