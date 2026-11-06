import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CollectionRow } from "@/components/CollectionRow";
import { getHomeRows } from "@/lib/catalog";

async function Rows({ locale }: { locale: "th" | "en" }) {
  const rows = await getHomeRows(locale);
  return rows.map((row) => <CollectionRow key={`${row.type}-${row.key}`} row={row} locale={locale} />);
}

function RowsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-72 rounded-box" />
      ))}
    </div>
  );
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, fs] = await Promise.all([getTranslations("Home"), getTranslations("FengShui")]);
  const l = locale === "th" ? "th" : "en";

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 pt-6 md:px-8">
      <h1 className="whitespace-pre-line text-2xl font-bold leading-snug tracking-tight md:text-4xl">{t("tagline")}</h1>
      <p className="mt-1.5 text-[15px] text-ink-soft md:text-lg">{t("subtitle")}</p>
      <Link href="/feng-shui" data-testid="home-feng-shui" className="btn btn-outline btn-primary mt-3 rounded-full">{fs("title")}</Link>
      <Suspense fallback={<RowsSkeleton />}>
        <Rows locale={l} />
      </Suspense>
    </main>
  );
}
