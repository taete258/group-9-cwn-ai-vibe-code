"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addItem, type CartItem } from "@/lib/cart-store";

type Tree = Omit<CartItem, "quantity">;

// เลือกจำนวน (1..stock) แล้วใส่ตะกร้า; stock = 0 → ปุ่มกดไม่ได้
export function AddToCart({ tree }: { tree: Tree }) {
  const t = useTranslations("Cart");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = tree.stock === 0;
  const clamp = (n: number) => Math.max(1, Math.min(tree.stock, Number.isFinite(n) ? Math.trunc(n) : 1));

  return (
    <div className="flex flex-col gap-3 border-t border-base-300 pt-4">
      <div className="flex items-end gap-3">
        <label className="form-control w-28">
          <span className="mb-1 text-sm text-ink-soft">{t("quantity")}</span>
          <input
            data-testid="quantity-input"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, tree.stock)}
            value={qty}
            disabled={soldOut}
            onChange={(e) => { setQty(clamp(e.target.valueAsNumber)); setAdded(false); }}
            className="input input-bordered w-full text-center text-lg font-bold"
          />
        </label>
        <button
          data-testid="add-to-cart"
          type="button"
          disabled={soldOut}
          onClick={() => { addItem(tree, qty); setAdded(true); }}
          className="btn btn-primary flex-1 rounded-full text-base font-bold"
        >
          {t("add")}
        </button>
      </div>
      <p role="status" className="min-h-6 text-sm font-medium text-success">
        {added && (<>{t("added")} · <Link href="/cart" className="link">{t("view")}</Link></>)}
      </p>
    </div>
  );
}
