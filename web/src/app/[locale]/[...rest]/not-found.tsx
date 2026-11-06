"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// client component: ใช้ locale จาก provider ของ layout (getTranslations ฝั่ง server อ่าน headers ตอน prerender ไม่ได้)
export default function PageNotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <section className="card card-border bg-base-100 text-center">
        <div className="card-body items-center gap-4 p-6">
          <h1 data-testid="error-message" className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-ink-soft">{t("pageBody")}</p>
          <div className="mt-2 flex w-full flex-col gap-3">
            <Link href="/" className="btn btn-primary btn-block">{t("home")}</Link>
            <Link href="/trees" className="btn btn-outline btn-primary btn-block">{t("trees")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
