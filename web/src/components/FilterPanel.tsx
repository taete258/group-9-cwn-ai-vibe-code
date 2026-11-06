"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

// มือถือ: แผงตัวกรองพับ/ขยายได้ (เริ่มต้นขยาย ตาม design) / desktop: แสดงเสมอเป็น sidebar
export function FilterPanel({ children }: { children: ReactNode }) {
  const t = useTranslations("Filter");
  const [open, setOpen] = useState(true);

  return (
    <aside className="card card-border bg-base-100 md:sticky md:top-20">
      <div className="card-body gap-4 p-5">
        <div className="flex items-center justify-between border-b border-base-300 pb-3">
          <h2 className="card-title gap-2 text-lg">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
            {t("title")}
          </h2>
          <button
            type="button"
            data-testid="filter-toggle"
            aria-expanded={open}
            aria-controls="filter-fields"
            onClick={() => setOpen((o) => !o)}
            className="btn btn-ghost btn-sm md:hidden"
          >
            {t("toggle")}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={open ? "" : "rotate-180"}><path d="m6 15 6-6 6 6" /></svg>
          </button>
        </div>
        <div id="filter-fields" className={`${open ? "block" : "hidden"} md:block`}>{children}</div>
      </div>
    </aside>
  );
}
