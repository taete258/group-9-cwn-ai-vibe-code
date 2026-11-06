import { describe, expect, it } from "vitest";
import { localizeFengShui, localizeTree, toTreeSummary } from "@/rules/localize";

const tree = {
  id: 1, slug: "monstera", nameTh: "มอนสเตอร่า", nameEn: "Monstera",
  descriptionTh: "คำอธิบาย", descriptionEn: "Description",
  scientificName: "Monstera deliciosa", originTh: "อเมริกากลาง", originEn: "Central America",
  species: "FOLIAGE", size: "M", careLevel: "EASY",
  lightTh: "แดดรำไร", lightEn: "Partial shade", waterTh: "สัปดาห์ละครั้ง", waterEn: "Weekly",
  heightCm: 60, potSizeInch: 8, petSafe: false, price: 129000, stock: 5, images: ["/trees/monstera-1.jpg"],
} as const;

describe("localizeTree", () => {
  it("เลือกฟิลด์ภาษาไทย", () => {
    expect(localizeTree(tree, "th")).toMatchObject({
      name: "มอนสเตอร่า", description: "คำอธิบาย", light: "แดดรำไร", water: "สัปดาห์ละครั้ง",
    });
  });
  it("เลือกฟิลด์ภาษาอังกฤษ", () => {
    expect(localizeTree(tree, "en")).toMatchObject({
      name: "Monstera", description: "Description", light: "Partial shade", water: "Weekly",
    });
  });
  it("แสดงชื่อไทยและอังกฤษคู่กันทุกภาษา พร้อมชื่อวิทยาศาสตร์และแหล่งกำเนิดตามภาษา", () => {
    expect(localizeTree(tree, "en")).toMatchObject({
      nameTh: "มอนสเตอร่า", nameEn: "Monstera", scientificName: "Monstera deliciosa", origin: "Central America",
    });
    expect(localizeTree(tree, "th")).toMatchObject({ origin: "อเมริกากลาง" });
  });
  it("ไม่รั่วฟิลด์ข้อความภาษาอื่น", () => {
    const out = localizeTree(tree, "en") as Record<string, unknown>;
    for (const k of ["descriptionTh", "descriptionEn", "lightTh", "waterTh", "originTh", "originEn"]) expect(out).not.toHaveProperty(k);
  });
  it("ไม่มีชื่อวิทยาศาสตร์/แหล่งกำเนิด → null (ซ่อนช่อง)", () => {
    const out = localizeTree({ ...tree, scientificName: null, originTh: null, originEn: null }, "th");
    expect(out.scientificName).toBeNull();
    expect(out.origin).toBeNull();
  });
});

describe("toTreeSummary", () => {
  it("คืนเฉพาะฟิลด์ตามสัญญา 13.3", () => {
    expect(toTreeSummary(tree, "th")).toEqual({
      id: 1, slug: "monstera", name: "มอนสเตอร่า", price: 129000, stock: 5, size: "M", species: "FOLIAGE",
    });
  });
});

describe("localizeFengShui", () => {
  it("เลือก reason ตามภาษา", () => {
    const row = { room: "LIVING", direction: "SE", benefit: "WEALTH", reasonTh: "เหตุผล", reasonEn: "Reason" } as const;
    expect(localizeFengShui(row, "th")).toEqual({ room: "LIVING", direction: "SE", benefit: "WEALTH", reason: "เหตุผล" });
    expect(localizeFengShui(row, "en").reason).toBe("Reason");
  });
});

import { toTreeCard } from "@/rules/localize";
describe("toTreeCard", () => {
  it("เพิ่ม image (รูปแรก หรือ null ถ้าไม่มีรูป)", () => {
    expect(toTreeCard(tree, "th")).toMatchObject({ slug: "monstera", image: "/trees/monstera-1.jpg" });
    expect(toTreeCard({ ...tree, images: [] }, "en").image).toBeNull();
  });
});
