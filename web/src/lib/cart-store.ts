"use client";

import { useSyncExternalStore } from "react";

// ตะกร้าอยู่ใน localStorage ของเบราว์เซอร์เท่านั้น (spec F5) — ราคา/stock จริงให้ server ตัดสินผ่าน /api/cart/quote
export type CartItem = { treeId: number; slug: string; nameTh: string; nameEn: string; image: string | null; price: number; stock: number; quantity: number };

const KEY = "tree-shop-cart";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let last: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

const isItem = (i: unknown): i is CartItem => {
  const o = i as Record<string, unknown>;
  return !!o && [o.treeId, o.price, o.stock, o.quantity].every(Number.isInteger) && typeof o.slug === "string";
};

function read(): CartItem[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* ใช้ตะกร้าว่างเมื่อ storage ใช้ไม่ได้ */ }
  if (raw !== last.raw) {
    let items = EMPTY;
    try { const p = JSON.parse(raw ?? "[]"); if (Array.isArray(p)) items = p.filter(isItem); } catch { /* ข้อมูลเสีย → ว่าง */ }
    last = { raw, items };
  }
  return last.items;
}

function write(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* เขียนไม่ได้ → ไม่เก็บ */ }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
};

export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);
export const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
  const items = read();
  const cur = items.find((i) => i.treeId === item.treeId);
  const q = Math.min(item.stock, (cur?.quantity ?? 0) + quantity);
  write(cur ? items.map((i) => (i === cur ? { ...i, ...item, quantity: q } : i)) : [...items, { ...item, quantity: q }]);
}
export const setQuantity = (treeId: number, quantity: number) =>
  write(read().map((i) => (i.treeId === treeId ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) } : i)));
export const removeItem = (treeId: number) => write(read().filter((i) => i.treeId !== treeId));
export const clearCart = () => write([]);
export const updatePrices = (prices: Record<number, number>) => write(read().map((i) => ({ ...i, price: prices[i.treeId] ?? i.price })));
