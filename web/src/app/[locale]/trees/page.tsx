import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilterBar } from "@/components/FilterBar";
import { TreeCard } from "@/components/TreeCard";
import { Link } from "@/i18n/navigation";
import { listCollections, listTrees } from "@/lib/catalog";
import { parseCatalogQuery, type CatalogQuery } from "@/rules/catalog-query";

type Props = PageProps<"/[locale]/trees">;

// ลิงก์ที่เอาตัวกรองหนึ่งตัวออก (คงตัวอื่นไว้)
function without(query: CatalogQuery, key: keyof CatalogQuery) {
  const sp = new URLSearchParams();
  const entries: [string, string | undefined][] = [
    ["collection", query.collection], ["size", query.size], ["species", query.species], ["care", query.care],
    ["petSafe", query.petSafe ? "1" : undefined], ["q", query.q], ["sort", query.sort === "newest" ? undefined : query.sort],
  ];
  for (const [k, v] of entries) if (v && k !== key) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `/trees?${qs}` : "/trees";
}

async function Results({ props }: { props: Props }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const l = locale === "th" ? "th" : "en";
  // หน้าเว็บละเลยค่าที่ไม่ถูกต้อง (FR-009)
  const parsed = parseCatalogQuery(await props.searchParams, { strict: false });
  if (!parsed.ok) throw new Error("unreachable: non-strict parse never fails");
  const query = parsed.query;

  const [trees, collections, t, f, species, care] = await Promise.all([
    listTrees(query, l), listCollections(l),
    getTranslations("List"), getTranslations("Filter"), getTranslations("Species"), getTranslations("Care"),
  ]);

  const chips: { key: keyof CatalogQuery; label: string }[] = [
    query.collection && { key: "collection" as const, label: collections.find((c) => c.key === query.collection)?.name ?? query.collection },
    query.size && { key: "size" as const, label: `${f("size")}: ${f(`sizes.${query.size}`)}` },
    query.species && { key: "species" as const, label: species(query.species) },
    query.care && { key: "care" as const, label: `${f("care")}: ${care(query.care)}` },
    query.petSafe && { key: "petSafe" as const, label: f("petSafe") },
    query.q && { key: "q" as const, label: `“${query.q}”` },
  ].filter(Boolean) as { key: keyof CatalogQuery; label: string }[];

  return (
    <div className="grid items-start gap-5 md:grid-cols-[280px_1fr] md:gap-8">
      <FilterBar query={query} collections={collections} />

      <section aria-labelledby="results-title" className="flex flex-col gap-4">
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-box border border-base-300 bg-base-100 p-3">
            <span className="text-sm font-bold text-ink-soft">{f("active")}:</span>
            {chips.map((c) => (
              <Link key={c.key} href={without(query, c.key)} aria-label={f("remove", { label: c.label })} className="badge badge-lg badge-soft badge-success gap-1.5 py-4 font-medium">
                {c.label}
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </Link>
            ))}
            <Link data-testid="filter-clear-all" href="/trees" className="ml-auto text-sm font-semibold text-primary hover:underline">{f("clearAll")}</Link>
          </div>
        )}

        <p data-testid="result-count" className="border-b border-base-300 pb-3 font-bold">{t("count", { count: trees.length })}</p>

        {trees.length === 0 ? (
          <div className="card card-border bg-base-100 text-center">
            <div className="card-body items-center gap-3 p-8">
              <svg aria-hidden="true" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M7 14h10l-1.5 7h-7zM12 14v-3M12 11c0-3 2-5 5-5 0 3-2 5-5 5ZM12 12c0-2-1.5-4-4-4 0 2.500 1.500 4 4 4Z" /></svg>
              <h2 data-testid="error-message" className="text-xl font-bold">{t("emptyTitle")}</h2>
              <p className="text-ink-soft">{t("emptyBody")}</p>
              <Link data-testid="clear-filters" href="/trees" className="btn btn-primary mt-2 w-full max-w-xs">{t("clear")}</Link>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {trees.map((tree) => (
              <li key={tree.id}><TreeCard tree={tree} locale={l} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default async function TreesPage(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const [t, header] = await Promise.all([getTranslations("List"), getTranslations("Header")]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8">
      <nav aria-label="breadcrumb" className="breadcrumbs py-3 text-sm text-ink-soft">
        <ul>
          <li><Link href="/">{header("home")}</Link></li>
          <li aria-current="page" className="font-semibold text-ink">{t("title")}</li>
        </ul>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-5 mt-1 text-ink-soft">{t("subtitle")}</p>
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 w-full rounded-box" />}>
        <Results props={props} />
      </Suspense>
    </main>
  );
}
