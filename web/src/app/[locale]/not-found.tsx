import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// ไม่พบสินค้า (ต้นแบบ empty-mobile/desktop สถานะที่สอง): ข้อความ + ทางกลับหน้าแรกและรายการ
export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <section className="card card-border bg-base-100 text-center">
        <div className="card-body items-center gap-4 p-6">
          <div className="flex w-full justify-center rounded-box border border-base-300 bg-base-200 py-10 text-accent" aria-hidden="true">
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 14h10l-1.5 7h-7z" className="text-terracotta" stroke="#d97746" />
              <path d="M12 14v-3" strokeDasharray="1.5 1.5" /><circle cx="12" cy="7" r="3.5" strokeDasharray="1.5 1.5" />
            </svg>
          </div>
          <h1 data-testid="error-message" className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-ink-soft">{t("body")}</p>
          <div className="mt-2 flex w-full flex-col gap-3">
            <Link href="/" className="btn btn-primary btn-block">{t("home")}</Link>
            <Link href="/trees" className="btn btn-outline btn-primary btn-block">{t("trees")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
