// data layer แคตตาล็อกจุดเดียว: ทั้งหน้าเว็บและ /api/* เรียกที่นี่ (ทุก query กรอง isActive)
// ponytail: ไม่ใช้ 'use cache' — Docker build ไม่มี DB แต่หน้าถูก prerender ตอน build จึงให้หน้าห่อ <Suspense> แล้ว stream ตอน request
//           ถ้าวัดแล้วช้า (SC-002) ค่อยเพิ่ม cache + revalidateTag
import { db } from "@/lib/db";
import { SIZES, SPECIES, type CatalogQuery } from "@/rules/catalog-query";
import type { Benefit, Room } from "@/rules/feng-shui";
import { localizeFengShui, localizeTree, toTreeCard, type Locale } from "@/rules/localize";

// Prisma ไม่ escape wildcard ของ LIKE ให้ → escape เอง ไม่ให้ % _ ในคำค้นทำงานเป็น wildcard
const likeEscape = (q: string) => q.replace(/[\\%_]/g, "\\$&");

const cardSelect = {
  id: true, slug: true, nameTh: true, nameEn: true, price: true, stock: true, size: true, species: true, images: true,
} as const;

export type TreeCard = ReturnType<typeof toTreeCard>;
export type HomeRow =
  | { type: "collection"; key: string; name: string; trees: TreeCard[] }
  | { type: "size" | "species"; key: string; trees: TreeCard[] };

export async function getHomeRows(locale: Locale): Promise<HomeRow[]> {
  const [collections, all] = await Promise.all([
    db.collection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: { where: { tree: { isActive: true } }, orderBy: { sortOrder: "asc" }, include: { tree: { select: cardSelect } } },
      },
    }),
    db.tree.findMany({ where: { isActive: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: cardSelect }),
  ]);

  const rows: HomeRow[] = [];
  for (const c of collections) {
    if (!c.items.length) continue; // หมวดว่างไม่แสดง (FR-001)
    rows.push({
      type: "collection", key: c.slug, name: locale === "th" ? c.nameTh : c.nameEn,
      trees: c.items.map((i) => toTreeCard(i.tree, locale)),
    });
  }
  for (const size of SIZES) {
    const trees = all.filter((t) => t.size === size).map((t) => toTreeCard(t, locale));
    if (trees.length) rows.push({ type: "size", key: size, trees });
  }
  for (const species of SPECIES) {
    const trees = all.filter((t) => t.species === species).map((t) => toTreeCard(t, locale));
    if (trees.length) rows.push({ type: "species", key: species, trees });
  }
  return rows;
}

// หมวดสำหรับตัวกรอง: active และมีต้นไม้ active อย่างน้อย 1 ต้น (กฎเดียวกับหน้าแรก)
export async function listCollections(locale: Locale) {
  const cols = await db.collection.findMany({
    where: { isActive: true, items: { some: { tree: { isActive: true } } } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameTh: true, nameEn: true },
  });
  return cols.map((c) => ({ key: c.slug, name: locale === "th" ? c.nameTh : c.nameEn }));
}

export async function listTrees(query: CatalogQuery, locale: Locale): Promise<TreeCard[]> {
  const orderBy =
    query.sort === "price_asc" ? [{ price: "asc" as const }, { id: "desc" as const }]
    : query.sort === "price_desc" ? [{ price: "desc" as const }, { id: "desc" as const }]
    : [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const rows = await db.tree.findMany({
    where: {
      isActive: true,
      ...(query.size && { size: query.size }),
      ...(query.species && { species: query.species }),
      ...(query.care && { careLevel: query.care }),
      ...(query.petSafe && { petSafe: true }),
      ...(query.collection && { collections: { some: { collection: { slug: query.collection, isActive: true } } } }),
      ...(query.q && {
        OR: [
          { nameTh: { contains: likeEscape(query.q), mode: "insensitive" as const } },
          { nameEn: { contains: likeEscape(query.q), mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy,
    select: cardSelect,
  });
  return rows.map((t) => toTreeCard(t, locale));
}

// สินค้าที่เกี่ยวข้อง (data-model.md): หมวดแรกตาม Collection.sortOrder ที่ต้นนี้สังกัด, active, ไม่รวมตัวเอง, สูงสุด 4
export async function getRelated(treeId: number, locale: Locale) {
  const col = await db.collection.findFirst({
    where: { isActive: true, items: { some: { treeId } } },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { treeId: { not: treeId }, tree: { isActive: true } },
        orderBy: { sortOrder: "asc" },
        take: 4,
        include: { tree: { select: cardSelect } },
      },
    },
  });
  return { collection: col?.slug ?? null, trees: col ? col.items.map((i) => toTreeCard(i.tree, locale)) : [] };
}

export async function getTreeBySlug(slug: string, locale: Locale) {
  const t = await db.tree.findFirst({ where: { slug, isActive: true }, include: { fengShui: { orderBy: { id: "asc" } } } });
  if (!t) return null;
  const related = await getRelated(t.id, locale);
  return {
    ...localizeTree(t, locale),
    fengShui: t.fengShui.map((f) => localizeFengShui(f, locale)),
    related: related.trees,
    relatedCollection: related.collection,
  };
}

// F4: ต้นที่แนะนำสำหรับ ห้อง × เรื่อง (เฉพาะต้นที่เปิดขาย) พร้อมทิศและเหตุผล
export async function getFengShuiPicks(room: Room, benefit: Benefit, locale: Locale) {
  const rows = await db.fengShui.findMany({
    where: { room, benefit, tree: { isActive: true } },
    orderBy: { treeId: "asc" },
    include: { tree: { select: cardSelect } },
  });
  return rows.map((r) => ({ ...toTreeCard(r.tree, locale), direction: r.direction, reason: locale === "th" ? r.reasonTh : r.reasonEn }));
}
