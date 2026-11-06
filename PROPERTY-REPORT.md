# PROPERTY-REPORT — `buildQuote`

ไฟล์: `web/tests/property/cart.property.test.ts` (fast-check, 1,000 ตะกร้าสุ่มต่อ property) · รัน `cd web && npm test`
oracle เขียนแยกเองในไฟล์ test จาก spec ข้อ 4 (ไม่ import ค่าหรือฟังก์ชันจาก `src/rules/cart.ts`) · ตะกร้าสุ่ม: 1–8 รายการ ราคา ฿1–฿5,000 จำนวน 1–50 stock 0–60 treeId ไม่ซ้ำ

| # | property | ชนิด |
|---|---|---|
| P1 | ทุกช่อง (subtotal, ค่าส่ง, total, vat, net, freeShippingRemaining) ตรง oracle | oracle |
| P2 | total = subtotal + ค่าส่ง · vat + net = total · amount = ราคา × จำนวน | invariant |
| P3 | ค่าส่ง 0 เมื่อ subtotal ≥ ฿1,000 ไม่เช่นนั้น ฿60 (สุ่มรอบขอบ 99,990–100,010) | boundary |
| P4 | \|vat×107 − total×7\| ≤ 53.5 (ปัดครั้งเดียวไม่คลาดเกินครึ่งสตางค์) | invariant |
| P5 | สลับลำดับรายการ ผลสรุปต้องเท่าเดิม | metamorphic |
| P6 | เพิ่มจำนวนหนึ่งรายการ subtotal ต้องเพิ่ม · ยอดสุทธิ **ลดได้** เมื่อข้ามเกณฑ์ส่งฟรี (99,999 → 105,999 แต่ 100,000 → 100,000) | metamorphic |
| P7 | เตือนหมด iff stock = 0 · เตือนไม่พอ iff 0 < stock < quantity (ไม่เตือนที่ quantity = stock) | oracle |

ผล: 7/7 ผ่าน · ไม่พบค่าที่ไม่ตรง oracle · P7 ฉบับแรกอ่อนเกินไป (ตรวจทิศเดียว) ถูกจับได้ด้วย mutation testing ดู `MUTATION-REPORT.md`

ข้อควรสังเกตจาก P6: ยอดสุทธิไม่ใช่ฟังก์ชันที่เพิ่มตามสินค้าเสมอ (ลูกค้าซื้อเพิ่มแล้วจ่ายน้อยลงได้ใกล้เกณฑ์ส่งฟรี) เป็นพฤติกรรมตามสเปก ไม่ใช่บั๊ก

ข้อจำกัด: oracle เขียนโดยคนเดียวกับผู้เขียนโค้ด (ไม่ได้เปิดแชตใหม่ที่เห็นแค่เอกสารตามที่ lab กำหนด) จึงยังมีโอกาสที่ความเข้าใจผิดในสเปกเดียวกันอยู่ทั้งสองฝั่ง
