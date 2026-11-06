import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { HomeRow, TreeCard as Tree } from "@/lib/catalog";
import { TreeCard } from "./TreeCard";

function rowMeta(row: HomeRow) {
  if (row.type === "collection") return { testId: `collection-row-${row.key}`, href: `/trees?collection=${row.key}` };
  if (row.type === "size") return { testId: `collection-row-size-${row.key}`, href: `/trees?size=${row.key}` };
  return { testId: `collection-row-species-${row.key}`, href: `/trees?species=${row.key}` };
}

// แถวต้นไม้: หัวแถว + "ดูทั้งหมด" และรายการเลื่อนแนวนอนเฉพาะในแถว (มือถือเห็นการ์ดถัดไปโผล่ครึ่งใบ, desktop เห็น 5 ใบ)
export async function CollectionRow({ row, locale }: { row: HomeRow; locale: "th" | "en" }) {
  const [common, size, species] = await Promise.all([getTranslations("Common"), getTranslations("Size"), getTranslations("Species")]);
  const { testId, href } = rowMeta(row);
  const title = row.type === "collection" ? row.name : row.type === "size" ? size(row.key) : species(row.key);

  return (
    <section data-testid={testId} aria-labelledby={`${testId}-title`} className="mt-6 md:mt-10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 id={`${testId}-title`} className="text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h2>
        <Link href={href} className="btn btn-ghost btn-primary shrink-0 gap-0.5 px-2 font-semibold">
          {common("viewAll")}
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
      <div data-scroller className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:scroll-px-8 md:gap-5 md:px-8">
        {row.trees.map((tree: Tree) => (
          <div key={tree.id} className="w-[162px] shrink-0 snap-start md:w-[calc((100%-5rem)/5)] md:min-w-48">
            <TreeCard tree={tree} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
