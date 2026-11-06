"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart, useHydrated } from "@/lib/cart-store";

export function CartLink() {
  const t = useTranslations("Cart");
  const count = useCart().reduce((s, i) => s + i.quantity, 0);
  const hydrated = useHydrated();

  return (
    <Link data-testid="cart-link" href="/cart" aria-label={t("title")} className="btn btn-ghost btn-circle relative">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></svg>
      {hydrated && count > 0 && <span data-testid="cart-count" className="badge badge-primary badge-sm absolute -right-1 -top-1">{count}</span>}
    </Link>
  );
}
