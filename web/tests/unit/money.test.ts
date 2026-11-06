import { describe, expect, it } from "vitest";
import { formatBaht } from "@/rules/money";

describe("formatBaht", () => {
  it("แสดง ฿1,290.00 เหมือนกันทั้งสองภาษา", () => {
    expect(formatBaht(129000, "th")).toBe("฿1,290.00");
    expect(formatBaht(129000, "en")).toBe("฿1,290.00");
  });
  it("ศูนย์และสตางค์", () => {
    expect(formatBaht(0, "th")).toBe("฿0.00");
    expect(formatBaht(5, "en")).toBe("฿0.05");
  });
  it("หลักพัน/หมื่นมีจุลภาค", () => {
    expect(formatBaht(24000000, "th")).toBe("฿240,000.00");
  });
});
