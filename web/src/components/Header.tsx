import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CartLink } from "./CartLink";
import { LangSwitch } from "./LangSwitch";

// daisyUI navbar — มือถือ: ชื่อร้าน + ปุ่มภาษา (ตาม design) / desktop: เพิ่มลิงก์หน้าแรก, ต้นไม้ทั้งหมด
export async function Header() {
  const t = await getTranslations("Header");

  return (
    <header className="sticky top-0 z-20 border-b border-base-300 bg-base-200/95 backdrop-blur-md">
      <nav className="navbar mx-auto max-w-[1200px] gap-2 px-4 py-1 md:px-8">
        <div className="navbar-start gap-4">
          <Link href="/" className="btn btn-ghost -ml-2 gap-2 px-2 text-xl font-bold tracking-tight">
            <svg aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.7 9.7 0 0 0 10 20c7.18 0 11-5 11-11 0-.69-.07-1.37-.2-2.03C19.67 7.37 18.37 7.73 17 8zm-7 10a7.7 7.7 0 0 1-1.63-.17C10.74 13.56 14.32 10.68 18.9 10c-.57 4.67-3.9 8-8.9 8z" />
            </svg>
            {t("brand")}
          </Link>
          <ul className="menu menu-horizontal hidden gap-1 p-0 text-base font-medium text-ink-soft md:flex">
            <li><Link href="/" className="flex min-h-12 items-center">{t("home")}</Link></li>
            <li><Link href="/trees" className="flex min-h-12 items-center">{t("trees")}</Link></li>
            <li><Link href="/feng-shui" className="flex min-h-12 items-center">{t("fengShui")}</Link></li>
          </ul>
        </div>
        <div className="navbar-end gap-1">
          <CartLink />
          <Suspense fallback={null}>
            <LangSwitch />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
