import { Suspense } from "react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFengShuiPicks } from "@/lib/catalog";
import { formatBaht } from "@/rules/money";
import { BENEFITS, parseFengShuiQuery, ROOMS, type Benefit, type Room } from "@/rules/feng-shui";

function Chips({ name, label, options, value, testId }: { name: string; label: string; options: { value: string; label: string }[]; value?: string; testId: string }) {
  return (
    <fieldset data-testid={testId} className="mb-4">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} defaultChecked={value === o.value} required className="peer sr-only" aria-label={o.label} />
            <span className="inline-flex min-h-12 items-center rounded-full border border-base-300 bg-base-200 px-4 text-sm font-medium text-ink-soft transition hover:bg-base-300 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-content peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function Results({ room, benefit, locale }: { room: Room; benefit: Benefit; locale: "th" | "en" }) {
  const [t, dir, tree] = await Promise.all([getTranslations("FengShui"), getTranslations("Direction"), getTranslations("Tree")]);
  const picks = await getFengShuiPicks(room, benefit, locale);

  return (
    <section aria-labelledby="fs-res" className="mt-6">
      <h2 id="fs-res" className="mb-3 text-xl font-bold">{t("results")}</h2>
      {picks.length === 0 ? (
        <p data-testid="error-message" className="card card-border bg-base-100 p-5">{t("none")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {picks.map((p) => (
            <li key={p.id} data-testid="fengshui-result" className="card card-border flex-row gap-3 bg-base-100 p-3">
              <Link href={`/trees/${p.slug}`} className="relative size-28 shrink-0 overflow-hidden rounded-field bg-oat">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/trees/${p.slug}`} className="font-bold">{p.name}</Link>
                <p className="text-sm font-semibold text-primary">{formatBaht(p.price, locale)} <span className="font-normal text-ink-soft">{tree("vatNote")}</span></p>
                <p className="text-sm"><span className="text-ink-soft">{tree("direction")}:</span> <b>{dir(p.direction)}</b></p>
                <p className="text-sm leading-relaxed">{p.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-center text-sm italic text-ink-soft">*{tree("disclaimer")}</p>
    </section>
  );
}

export default async function FengShuiPage({ params, searchParams }: PageProps<"/[locale]/feng-shui">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale === "th" ? "th" : "en";
  const [t, room, benefit] = await Promise.all([getTranslations("FengShui"), getTranslations("Room"), getTranslations("Benefit")]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 pt-6 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-ink-soft">{t("subtitle")}</p>
      <Suspense fallback={<div aria-hidden="true" className="skeleton mt-6 h-64 rounded-box" />}>
        <Form searchParams={searchParams} locale={l} labels={{ room: t("room"), benefit: t("benefit"), submit: t("submit"), rooms: ROOMS.map((v) => ({ value: v, label: room(v) })), benefits: BENEFITS.map((v) => ({ value: v, label: benefit(v) })) }} />
      </Suspense>
    </main>
  );
}

// searchParams เป็นข้อมูลตอน request จึงอ่านใน Suspense (Next 16 cacheComponents)
async function Form({ searchParams, locale, labels }: {
  searchParams: PageProps<"/[locale]/feng-shui">["searchParams"]; locale: "th" | "en";
  labels: { room: string; benefit: string; submit: string; rooms: { value: string; label: string }[]; benefits: { value: string; label: string }[] };
}) {
  const { room, benefit } = parseFengShuiQuery(await searchParams);
  return (
    <>
      <form method="get" className="card card-border mt-4 bg-base-100 p-5">
        <Chips testId="fengshui-room" name="room" label={labels.room} options={labels.rooms} value={room} />
        <Chips testId="fengshui-benefit" name="benefit" label={labels.benefit} options={labels.benefits} value={benefit} />
        <button type="submit" className="btn btn-primary w-full rounded-full md:w-fit md:px-10">{labels.submit}</button>
      </form>
      {room && benefit && <Results room={room} benefit={benefit} locale={locale} />}
    </>
  );
}
