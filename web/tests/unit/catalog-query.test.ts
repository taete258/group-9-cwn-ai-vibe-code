import { describe, expect, it } from "vitest";
import { parseCatalogQuery } from "@/rules/catalog-query";

describe("parseCatalogQuery (โหมดหน้าเว็บ ละเลยค่าผิด)", () => {
  it("ค่าเริ่มต้น", () => {
    const r = parseCatalogQuery({}, { strict: false });
    expect(r).toEqual({ ok: true, query: { petSafe: false, sort: "newest" } });
  });
  it("ทิ้ง enum ที่ไม่ถูกต้องเป็นรายตัว แต่เก็บตัวที่ถูก", () => {
    const r = parseCatalogQuery({ size: "XL", species: "FOLIAGE", sort: "bad" }, { strict: false });
    expect(r).toEqual({ ok: true, query: { species: "FOLIAGE", petSafe: false, sort: "newest" } });
  });
  it("q ตัดช่องว่างหัวท้าย และช่องว่างล้วน = ไม่ค้น", () => {
    expect(parseCatalogQuery({ q: "  monstera " }, { strict: false })).toMatchObject({ ok: true, query: { q: "monstera" } });
    const blank = parseCatalogQuery({ q: "   " }, { strict: false });
    expect(blank.ok && blank.query.q).toBeUndefined();
  });
  it("petSafe=1 เท่านั้นที่เปิด", () => {
    expect(parseCatalogQuery({ petSafe: "1" }, { strict: false })).toMatchObject({ query: { petSafe: true } });
    expect(parseCatalogQuery({ petSafe: "true" }, { strict: false })).toMatchObject({ query: { petSafe: false } });
  });
  it("ค่าซ้ำ (array) ใช้ค่าแรก", () => {
    expect(parseCatalogQuery({ size: ["S", "L"] }, { strict: false })).toMatchObject({ query: { size: "S" } });
  });
  it("ครบทุกตัวกรอง", () => {
    const r = parseCatalogQuery(
      { collection: "lucky", size: "M", species: "HERB", care: "HARD", petSafe: "1", q: "a", sort: "price_desc" },
      { strict: false },
    );
    expect(r).toEqual({
      ok: true,
      query: { collection: "lucky", size: "M", species: "HERB", care: "HARD", petSafe: true, q: "a", sort: "price_desc" },
    });
  });
});

describe("parseCatalogQuery (โหมด strict สำหรับ API)", () => {
  it("enum ผิด → VALIDATION_ERROR", () => {
    expect(parseCatalogQuery({ size: "XL" }, { strict: true })).toEqual({ ok: false, error: "VALIDATION_ERROR" });
    expect(parseCatalogQuery({ sort: "bad" }, { strict: true })).toEqual({ ok: false, error: "VALIDATION_ERROR" });
  });
  it("ค่าถูกต้องผ่าน", () => {
    expect(parseCatalogQuery({ size: "S", sort: "price_asc" }, { strict: true })).toMatchObject({ ok: true });
  });
});

describe("คำค้นที่มีแต่อักขระพิเศษ (spec Edge Cases)", () => {
  it("ไม่มีตัวอักษร/ตัวเลขเลย → ไม่ค้นหา", () => {
    for (const q of ["%", "_", "'", "\\", "  ", "!!! ", " % _ "]) {
      const r = parseCatalogQuery({ q }, { strict: true });
      expect(r.ok && r.query.q, JSON.stringify(q)).toBeUndefined();
    }
  });
  it("มีตัวอักษรหรือตัวเลขแล้วค้นตามปกติ (ไทย/อังกฤษ/ตัวเลข)", () => {
    for (const q of ["มอน", "Monstera", "bird's", "50"]) {
      const r = parseCatalogQuery({ q }, { strict: true });
      expect(r.ok && r.query.q).toBe(q);
    }
  });
});
