import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { TreeCard as Tree } from "@/lib/catalog";
import { formatBaht } from "@/rules/money";

// การ์ด (daisyUI card) = รูป + ชื่อตามภาษา + ราคา (รวม VAT) + badge "สินค้าหมด" เมื่อ stock = 0 เท่านั้น (ตาม design/README.md)
export async function TreeCard({ tree, locale, testId }: { tree: Tree; locale: "th" | "en"; testId?: string }) {
  const t = await getTranslations("Common");
  const soldOut = tree.stock === 0;

  return (
    <Link
      href={`/trees/${tree.slug}`}
      data-testid={testId ?? `tree-card-${tree.slug}`}
      className={`card card-border card-sm group h-full overflow-hidden transition ${
        soldOut ? "bg-base-200" : "bg-base-100 shadow-card hover:shadow-md"
      }`}
    >
      <figure className="relative aspect-square bg-oat">
        {tree.image ? (
          <Image
            src={tree.image}
            alt={tree.name}
            fill
            sizes="(min-width: 768px) 240px, 162px"
            className={`object-cover transition duration-500 group-hover:scale-105 ${soldOut ? "opacity-60 grayscale" : ""}`}
          />
        ) : (
          <svg aria-hidden="true" className="text-accent" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-9" /><path d="M12 13c0-4 3-7 8-7 0 5-3 8-8 7Z" /><path d="M12 15c0-3-2-6-7-6 0 4 2 7 7 6Z" /></svg>
        )}
      </figure>
      <div className="card-body justify-between gap-2 p-3">
        <div>
          {soldOut && (
            <span data-testid="sold-out-badge" className="badge badge-sm badge-soft badge-neutral mb-1 font-semibold">
              {t("soldOut")}
            </span>
          )}
          <h3 className={`card-title line-clamp-1 text-base leading-snug ${soldOut ? "text-ink-soft" : ""}`}>{tree.name}</h3>
        </div>
        <p className="flex items-baseline justify-between gap-2 border-t border-base-300 pt-2">
          <span data-testid="card-price" className={`text-[17px] font-bold tracking-tight ${soldOut ? "text-ink-soft" : "text-primary"}`}>
            {formatBaht(tree.price, locale)}
          </span>
          <span className="text-xs text-ink-soft">{t("vat")}</span>
        </p>
      </div>
    </Link>
  );
}
