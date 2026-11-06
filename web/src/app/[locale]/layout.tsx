import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import "../globals.css";

const notoSansThai = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-noto-sans-thai", display: "swap" });

export const metadata: Metadata = { title: "Tree Shop" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function Footer() {
  const t = await getTranslations("Header");
  return <footer className="footer footer-center mt-12 border-t border-base-300 p-6 text-sm text-ink-soft"><p>{t("rights")}</p></footer>;
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={notoSansThai.variable}>
      <body data-bug-mode={process.env.BUG_MODE ?? "0"}>
        <NextIntlClientProvider>
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
