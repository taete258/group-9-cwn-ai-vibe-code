"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { clearCart, removeItem, setQuantity, updatePrices, useCart, useHydrated } from "@/lib/cart-store";
import { formatBaht } from "@/rules/money";
import type { buildQuote } from "@/rules/cart";

type Quote = ReturnType<typeof buildQuote>;
type State = { key: string; quote: Quote | null }; // quote null = ไม่พบสินค้าบางรายการ

// หน้าตะกร้า: ตัวเลขทุกตัวมาจาก /api/cart/quote (server คำนวณใหม่เสมอ) ตะกร้าจบที่สรุปยอด ไม่มี checkout
export function CartView() {
  const t = useTranslations("Cart");
  const locale = useLocale() as "th" | "en";
  const items = useCart();
  const hydrated = useHydrated();
  const [state, setState] = useState<State | null>(null);
  const key = items.map((i) => `${i.treeId}:${i.quantity}`).join(",");

  useEffect(() => {
    if (!items.length) return;
    const ctrl = new AbortController();
    fetch(`/api/cart/quote?locale=${locale}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: items.map(({ treeId, quantity }) => ({ treeId, quantity })) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((quote: Quote | null) => setState({ key, quote }))
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key แทน items (เปลี่ยนเมื่อ id/จำนวนเปลี่ยน)
  }, [key, locale]);

  if (!hydrated) return <div aria-hidden="true" className="skeleton h-64 rounded-box" />;

  if (!items.length) {
    return (
      <div data-testid="cart-empty" className="card card-border bg-base-100 p-8 text-center">
        <p className="text-lg font-semibold">{t("empty")}</p>
        <p className="mt-1 text-ink-soft">{t("emptyHint")}</p>
        <Link href="/trees" className="btn btn-primary mx-auto mt-4 rounded-full">{t("browse")}</Link>
      </div>
    );
  }

  const q = state?.key === key ? state.quote : undefined;
  if (state?.key === key && !q) {
    return (
      <div className="card card-border bg-base-100 p-6" data-testid="error-message">
        <p className="font-semibold">{t("unavailable")}</p>
        <button type="button" className="btn btn-outline mt-3 w-fit rounded-full" onClick={clearCart}>{t("clear")}</button>
      </div>
    );
  }

  const name = (i: (typeof items)[number]) => (locale === "th" ? i.nameTh : i.nameEn);
  const price = (id: number) => q?.lines.find((l) => l.treeId === id)?.unitPrice;
  const changed = q ? items.filter((i) => price(i.treeId) !== undefined && price(i.treeId) !== i.price) : [];
  const warnings = [
    ...(q?.warnings ?? []).map((w) => {
      const i = items.find((x) => x.treeId === w.treeId);
      return { id: `${w.code}-${w.treeId}`, text: w.code === "OUT_OF_STOCK" ? t("warnOut", { name: i ? name(i) : "" }) : t("warnLow", { name: i ? name(i) : "", count: w.available }) };
    }),
    ...changed.map((i) => ({ id: `price-${i.treeId}`, text: t("warnPrice", { name: name(i), price: formatBaht(price(i.treeId)!, locale) }) })),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="flex flex-col gap-4">
        {warnings.length > 0 && (
          <div data-testid="cart-warning" role="alert" className="alert alert-warning alert-soft flex-col items-start gap-1">
            {warnings.map((w) => <p key={w.id}>{w.text}</p>)}
            {changed.length > 0 && (
              <button type="button" className="btn btn-sm btn-warning mt-1" onClick={() => updatePrices(Object.fromEntries(changed.map((i) => [i.treeId, price(i.treeId)!])))}>{t("ack")}</button>
            )}
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.treeId} data-testid="cart-line" className="card card-border flex-row gap-3 bg-base-100 p-3">
              <Link href={`/trees/${i.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-field bg-oat">
                {i.image && <Image src={i.image} alt={name(i)} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/trees/${i.slug}`} className="font-bold">{name(i)}</Link>
                    <p className="text-sm text-ink-soft">{formatBaht(price(i.treeId) ?? i.price, locale)}</p>
                  </div>
                  <button data-testid="cart-remove" type="button" className="btn btn-ghost btn-sm btn-circle" aria-label={t("remove")} onClick={() => removeItem(i.treeId)}>✕</button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="join">
                    <button data-testid="cart-dec" type="button" className="btn btn-sm join-item" aria-label={t("dec")} disabled={i.quantity <= 1} onClick={() => setQuantity(i.treeId, i.quantity - 1)}>−</button>
                    <span data-testid="cart-qty" className="join-item flex min-w-10 items-center justify-center border border-base-300 px-2 font-bold">{i.quantity}</span>
                    <button data-testid="cart-inc" type="button" className="btn btn-sm join-item" aria-label={t("inc")} disabled={i.quantity >= i.stock} onClick={() => setQuantity(i.treeId, i.quantity + 1)}>+</button>
                  </div>
                  <span className="font-bold text-primary">{formatBaht((price(i.treeId) ?? i.price) * i.quantity, locale)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section aria-labelledby="sum-title" className="card card-border bg-base-100 lg:sticky lg:top-20">
        <div className="card-body gap-3 p-5">
          <h2 id="sum-title" className="card-title text-lg">{t("summary")}</h2>
          {q ? (
            <dl className="flex flex-col gap-2">
              <Row label={t("subtotal")} testId="cart-subtotal" value={formatBaht(q.subtotal, locale)} />
              <Row label={t("shipping")} testId="cart-shipping" value={q.shippingFee === 0 ? t("free") : formatBaht(q.shippingFee, locale)} />
              <p data-testid="free-shipping-remaining" className="rounded-field bg-base-200 p-2 text-sm text-ink-soft">
                {q.freeShippingRemaining > 0 ? t("freeRemaining", { amount: formatBaht(q.freeShippingRemaining, locale) }) : t("freeReached")}
              </p>
              <div className="border-t border-base-300 pt-3"><Row label={t("total")} testId="cart-total" value={formatBaht(q.total, locale)} strong /></div>
              <Row label={t("net")} testId="cart-net" value={formatBaht(q.net, locale)} muted />
              <Row label={t("vat")} testId="cart-vat" value={formatBaht(q.vat, locale)} muted />
            </dl>
          ) : (
            <div aria-hidden="true" className="skeleton h-40 rounded-box" />
          )}
          <p className="text-sm text-ink-soft">{t("note")}</p>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, testId, strong, muted }: { label: string; value: string; testId: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-lg font-bold" : ""} ${muted ? "text-sm text-ink-soft" : ""}`}>
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}
