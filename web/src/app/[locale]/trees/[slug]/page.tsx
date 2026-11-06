import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddToCart } from "@/components/AddToCart";
import { FengShuiBox } from "@/components/FengShuiBox";
import { Gallery } from "@/components/Gallery";
import { TreeCard } from "@/components/TreeCard";
import { Link } from "@/i18n/navigation";
import { getTreeBySlug } from "@/lib/catalog";
import { formatBaht } from "@/rules/money";

type Props = PageProps<"/[locale]/trees/[slug]">;

const icon = (d: ReactNode) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-base-200 text-primary" aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
  </span>
);
const ICONS = {
  light: icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  water: icon(<path d="M12 2.7s6 6.3 6 11.3a6 6 0 0 1-12 0c0-5 6-11.3 6-11.3z" />),
  height: icon(<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />),
  pot: icon(<path d="M5 9h14l-2 11H7zM4 5h16v4H4z" />),
  care: icon(<><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>),
};

async function Detail({ params }: { params: Props["params"] }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale === "th" ? "th" : "en";
  const tree = await getTreeBySlug(slug, l);
  if (!tree) notFound();

  const [t, common, care] = await Promise.all([getTranslations("Tree"), getTranslations("Common"), getTranslations("Care")]);
  const header = await getTranslations("Header");
  const soldOut = tree.stock === 0;

  const careRows = [
    { key: "light", label: t("light"), value: tree.light },
    { key: "water", label: t("water"), value: tree.water },
    tree.heightCm !== null && { key: "height", label: t("height"), value: t("heightValue", { cm: tree.heightCm }) },
    tree.potSizeInch !== null && { key: "pot", label: t("pot"), value: t("potValue", { inch: tree.potSizeInch }) },
    { key: "care", label: t("careLevel"), value: care(tree.careLevel) },
  ].filter(Boolean) as { key: keyof typeof ICONS; label: string; value: string }[];

  return (
    <>
      <nav aria-label={t("breadcrumb")} className="breadcrumbs py-3 text-sm text-ink-soft">
        <ul>
          <li><Link href="/">{header("home")}</Link></li>
          <li><Link href="/trees">{header("trees")}</Link></li>
          <li aria-current="page" className="font-semibold text-ink">{tree.name}</li>
        </ul>
      </nav>

      {/* มือถือเรียงบนลงล่าง / desktop (lg) 2 คอลัมน์: ซ้าย = แกลเลอรี + ฮวงจุ้ย, ขวา = ชื่อ-ราคา + เกี่ยวกับ + การดูแล */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-x-8">
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Gallery images={tree.images} name={tree.name} />
        </div>

        <section className="card card-border bg-base-100 lg:col-start-2 lg:row-start-1">
          <div className="card-body gap-3 p-5 md:p-6">
            <span
              data-testid="tree-stock"
              className={`badge badge-lg badge-soft w-fit gap-2 font-semibold ${soldOut ? "badge-neutral" : "badge-success"}`}
            >
              {!soldOut && <span className="status status-success" aria-hidden="true" />}
              {soldOut ? t("soldOut") : t("stock", { count: tree.stock })}
            </span>
            <h1 className="text-3xl font-bold leading-snug tracking-tight">{tree.name}</h1>
            {tree.scientificName && <p className="-mt-2 italic text-ink-soft">{tree.scientificName}</p>}
            <p className="flex items-baseline gap-2 border-t border-base-300 pt-3">
              <span data-testid="tree-price" className={`text-3xl font-bold ${soldOut ? "text-ink-soft" : "text-primary"}`}>
                {formatBaht(tree.price, l)}
              </span>
              <span className="text-sm text-ink-soft">{t("vatNote")}</span>
            </p>
            <AddToCart tree={{ treeId: tree.id, slug: tree.slug, nameTh: tree.nameTh, nameEn: tree.nameEn, image: tree.images[0] ?? null, price: tree.price, stock: tree.stock }} />
          </div>
        </section>

        <section aria-labelledby="about-title" className="card card-border bg-base-100 lg:col-start-2 lg:row-start-2">
          <div className="card-body gap-4 p-5 md:p-6">
            <h2 id="about-title" className="card-title text-lg">{t("about")}</h2>
            <dl data-testid="plant-names" className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-field bg-base-200 p-4 text-sm">
              <div><dt className="text-ink-soft">{t("nameTh")}</dt><dd className="font-semibold">{tree.nameTh}</dd></div>
              <div><dt className="text-ink-soft">{t("nameEn")}</dt><dd className="font-semibold">{tree.nameEn}</dd></div>
              {tree.scientificName && <div><dt className="text-ink-soft">{t("scientific")}</dt><dd className="font-semibold italic">{tree.scientificName}</dd></div>}
              {tree.origin && <div className={tree.scientificName ? "" : "col-span-2"}><dt className="text-ink-soft">{t("origin")}</dt><dd className="font-semibold">{tree.origin}</dd></div>}
            </dl>
            <p data-testid="tree-description" className="whitespace-pre-line text-[17px] leading-relaxed">{tree.description}</p>
          </div>
        </section>

        <section data-testid="care-info" aria-labelledby="care-title" className="card card-border self-start bg-base-100 lg:col-start-2 lg:row-start-3">
          <div className="card-body gap-4 p-5 md:p-6">
            <h2 id="care-title" className="card-title border-b border-base-300 pb-3 text-lg">{t("care")}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {careRows.map((r) => (
                <li key={r.key} className="flex items-center gap-3 rounded-field border border-base-300 bg-base-200/50 p-3 sm:last:odd:col-span-2">
                  {ICONS[r.key]}
                  <div className="leading-snug">
                    <p className="text-xs text-ink-soft">{r.label}</p>
                    <p className="font-bold">{r.value}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div role="note" className={`alert alert-soft ${tree.petSafe ? "alert-success" : "alert-warning"}`}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {tree.petSafe ? <path d="M20 6 9 17l-5-5" /> : <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>}
              </svg>
              <div>
                <p className="font-bold">{tree.petSafe ? t("petSafe") : t("petToxic")}</p>
                <p className="text-sm">{tree.petSafe ? t("petSafeHint") : t("petToxicHint")}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="self-start empty:hidden lg:col-start-1 lg:row-start-3">
          <FengShuiBox rows={tree.fengShui} />
        </div>
      </div>

      {tree.related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-10">
          <div className="mb-2 flex items-center justify-between gap-4">
            <h2 id="related-title" className="text-xl font-bold tracking-tight md:text-2xl">{t("related")}</h2>
            {tree.relatedCollection && (
              <Link href={`/trees?collection=${tree.relatedCollection}`} className="btn btn-ghost btn-primary shrink-0 gap-0.5 px-2 font-semibold">
                {common("viewAll")}
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
            {tree.related.map((r) => (
              <div key={r.id} className="w-[162px] shrink-0 snap-start md:w-auto">
                <TreeCard tree={r} locale={l} testId="related-tree" />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function TreeDetailPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8">
      <Suspense fallback={<div aria-hidden="true" className="skeleton mt-14 aspect-square w-full rounded-box md:aspect-[3/1]" />}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}
