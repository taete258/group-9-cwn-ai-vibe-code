import { describe, expect, it } from "vitest";
import { parseFengShuiQuery } from "@/rules/feng-shui";

describe("parseFengShuiQuery", () => {
  it("ค่าถูกต้อง → ผ่านทั้งคู่", () => {
    expect(parseFengShuiQuery({ room: "LIVING", benefit: "WEALTH" })).toEqual({ room: "LIVING", benefit: "WEALTH" });
  });
  it("ค่าผิด/ไม่มี/ตัวพิมพ์เล็ก → undefined เป็นรายตัว", () => {
    expect(parseFengShuiQuery({ room: "living", benefit: "WEALTH" })).toEqual({ room: undefined, benefit: "WEALTH" });
    expect(parseFengShuiQuery({})).toEqual({ room: undefined, benefit: undefined });
    expect(parseFengShuiQuery({ room: "GARAGE", benefit: "x" })).toEqual({ room: undefined, benefit: undefined });
  });
  it("ค่าซ้ำใน URL ใช้ตัวแรก", () => {
    expect(parseFengShuiQuery({ room: ["OFFICE", "LIVING"] }).room).toBe("OFFICE");
  });
});
