# MUTATION-REPORT — `src/rules/cart.ts`

เครื่องมือ: Stryker (`@stryker-mutator/core` + vitest runner) · ตั้งค่า `web/stryker.config.json` · รัน `cd web && npm run mutation` · ผล `web/mutation/report.html` / `report.json`
ขอบเขต: ฟังก์ชันคำนวณตะกร้า `buildQuote` ไฟล์เดียว (เป็นส่วนที่เกี่ยวกับเงิน) · ตัวฆ่า mutant = unit test (`tests/unit`) + property test (`tests/property`) ไม่รวม e2e (ช้าเกินไปต่อ mutant)

| รอบ | mutant | killed | survived | score |
|---|---|---|---|---|
| 1 | 33 | 32 | 1 | 96.97% |
| 2 (หลังเพิ่ม test) | 33 | 33 | 0 | **100%** |

## Mutant ที่รอดในรอบ 1

| ไฟล์:บรรทัด | การแก้ | ถ้าเป็นบั๊กจริง ลูกค้าเห็นอะไร |
|---|---|---|
| `cart.ts:17` | `i.quantity > i.stock` → `i.quantity >= i.stock` | ตะกร้าที่ซื้อ **เท่ากับ** จำนวนคงเหลือ (เช่น มอนสเตอร่า 5 จาก 5) ถูกเตือนว่า "เหลือเพียง 5 ต้น" ทั้งที่ซื้อได้ ลูกค้าอาจลดจำนวนโดยไม่จำเป็น |

**สาเหตุที่ test เดิมไม่จับ:** property P7 ตรวจแค่ทิศเดียว ("ถ้า quantity > stock ต้องเตือน") ไม่ได้ตรวจกลับว่า "ถ้า quantity ≤ stock ต้องไม่เตือน" และ unit test ไม่มีกรณี quantity = stock (ขอบ)
(e2e TC-CART-07 ครอบขอบนี้ที่ระดับ API อยู่แล้ว แต่ไม่ได้อยู่ในชุดที่ใช้ฆ่า mutant)

**การแก้:** เพิ่มเงื่อนไขย้อนกลับใน P7 (`quantity <= stock` ต้องไม่มีคำเตือน) และให้ treeId ในตะกร้าสุ่มไม่ซ้ำกัน (ตรงกับที่ API รวมบรรทัดซ้ำก่อนคำนวณ) → รอบ 2 รอด 0 ตัว

## ข้อจำกัด
- mutant มีแค่ 33 ตัวจากไฟล์เดียว (ตัวเลขเล็ก) ไม่ได้พิสูจน์ว่าแผนทั้งชุดแข็งแรง
- ไม่ได้ทำ mutation กับ `catalog-query.ts`, `localize.ts`, API route หรือ UI
