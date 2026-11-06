import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const other = locale === "th" ? "en" : "th";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link data-testid="lang-switch" href={`/${other}`} className="underline">
          {(await getTranslations("Lang"))("switch")}
        </Link>
      </header>
      <p className="mt-4">{t("tagline")}</p>
    </main>
  );
}
