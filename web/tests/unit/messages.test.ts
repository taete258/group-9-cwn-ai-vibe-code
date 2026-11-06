import { describe, expect, it } from "vitest";
import th from "../../messages/th.json";
import en from "../../messages/en.json";

function leaves(obj: unknown, prefix = ""): [string, unknown][] {
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [[prefix, obj]];
}

describe("messages th/en (constitution IV)", () => {
  it("key ตรงกันพอดี", () => {
    expect(leaves(th).map(([k]) => k).sort()).toEqual(leaves(en).map(([k]) => k).sort());
  });
  it("ไม่มีค่าสตริงว่าง", () => {
    for (const [k, v] of [...leaves(th), ...leaves(en)]) {
      expect(typeof v === "string" && v.trim().length > 0, k).toBe(true);
    }
  });
});
