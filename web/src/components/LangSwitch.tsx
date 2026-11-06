"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

// สลับภาษาโดยอยู่หน้าเดิมและคง query (FR-018)
export function LangSwitch() {
  const t = useTranslations("Lang");
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;

  return (
    <Link
      data-testid="lang-switch"
      href={href}
      locale={locale === "th" ? "en" : "th"}
      className="btn btn-outline rounded-full border-base-300 bg-base-100 px-4 font-medium shadow-sm hover:border-primary hover:bg-base-100 hover:text-primary"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {t("switch")}
    </Link>
  );
}
