# Feature 003 — ตะกร้า (สรุปยอด) และแนะนำฮวงจุ้ย

**สถานะ:** เสร็จแล้ว (บันทึกย้อนหลัง — ทำนอกขั้นตอน specify/plan/tasks ตามคำสั่งตรงของผู้ใช้ จึงไม่มี plan.md/tasks.md)
**อ้างอิง:** `spec.md` ราก v0.5 ข้อ 3.1 F4–F5, ข้อ 4, ข้อ 7, ข้อ 13.3–13.5 · user story US-04, US-10 · constitution v2.0.0 (ข้อ I, II, IV, V, VI)

## ขอบเขต

| รวม | ไม่รวม |
| --- | --- |
| ตะกร้าแบบ Guest ใน `localStorage`, `POST /api/cart/quote`, หน้า `/cart` สรุปยอด VAT/ค่าส่ง | checkout, ชำระเงิน, สั่งซื้อ, ปุ่มคัดลอก/แชร์ตะกร้า (คำถามข้อ 10 ตอบแล้ว: จบที่สรุปยอด) |
| หน้า `/feng-shui` + `GET /api/feng-shui` (rule-based จากข้อมูล seed) | คำนวณจากวันเกิด/ทิศบ้านจริง, AI |

## US-04 ตะกร้า

| # | เงื่อนไข | หลักฐานทดสอบ |
| --- | --- | --- |
| 1 | ใส่ตะกร้าจากหน้ารายละเอียดได้ จำนวนไม่เกิน stock; สินค้าหมดกดไม่ได้ | `cart.spec.ts` |
| 2 | เพิ่ม/ลด/ลบรายการได้ ตะกร้าไม่หายเมื่อรีโหลดและสลับภาษา | `cart.spec.ts` |
| 3 | ค่าส่ง 60 บาท ส่งฟรีเมื่อ subtotal `>=` 1,000 บาท; VAT = round(total×7/107) ปัดครั้งเดียว | `cart.test.ts` |
| 4 | ตัวเลขทุกตัวในหน้ามาจาก `/api/cart/quote` (server คำนวณใหม่ ไม่เชื่อราคาจาก client) | `api-cart-quote.spec.ts` |
| 5 | เตือน `OUT_OF_STOCK` / `INSUFFICIENT_STOCK` (server) และราคาเปลี่ยน (client เทียบราคาที่เก็บไว้ พร้อมปุ่มรับทราบ) | `cart.spec.ts`, `api-cart-quote.spec.ts` |
| 6 | "ซื้อเพิ่มอีก ฿X เพื่อรับส่งฟรี" เมื่อยังไม่ถึงเกณฑ์ | `cart.spec.ts` |

**ข้อมูลในตะกร้า (localStorage คีย์ `tree-shop-cart`):** `{treeId, slug, nameTh, nameEn, image, price, stock, quantity}` — `stock` ใช้จำกัดปุ่ม +/จำนวน ส่วนความจริงของ stock ยังมาจาก server ผ่านคำเตือน

**API `POST /api/cart/quote`** — รูปแบบตามข้อ 13.4: body `{items:[{treeId, quantity}]}` (1–100 รายการ, quantity จำนวนเต็ม 1–999, `treeId` ซ้ำรวมเป็นบรรทัดเดียว, field อื่นถูกเมิน) · 400 `VALIDATION_ERROR` · 404 `NOT_FOUND` เมื่อมี id ที่ไม่มีหรือซ่อนอยู่ · ไม่บันทึกอะไร · ผลเหมือนกันทั้ง `locale=th|en`
`warnings[].code` ที่ server คืนมีเฉพาะ `OUT_OF_STOCK` และ `INSUFFICIENT_STOCK` ส่วน `PRICE_CHANGED` ในสัญญาข้อ 13.4 ตรวจที่หน้าเว็บ (server ไม่รู้ราคาที่ลูกค้าเห็นตอนใส่ตะกร้า)

## US-10 แนะนำฮวงจุ้ย

| # | เงื่อนไข | หลักฐานทดสอบ |
| --- | --- | --- |
| 1 | เลือกห้อง 6 แบบ × เรื่อง 4 แบบ แล้วได้ต้นไม้พร้อมทิศและเหตุผล | `feng-shui.spec.ts` |
| 2 | ห้องนั่งเล่น + การเงิน = monstera, syngonium, pachira | `feng-shui.spec.ts` |
| 3 | มีข้อความ "คำแนะนำตามความเชื่อ เพื่อความสบายใจ" | `feng-shui.spec.ts` |
| 4 | ไม่มีต้นที่ตรง → ข้อความแจ้ง (`error-message`) ไม่ใช่หน้าว่าง; ค่าใน URL ผิด → ถือว่ายังไม่เลือก | `feng-shui.spec.ts` |
| 5 | ค่าที่เลือกอยู่ใน URL แชร์ได้ และคงเมื่อสลับภาษา | `feng-shui.spec.ts` |

**API `GET /api/feng-shui?room=&benefit=`** — ต้องมีทั้งสองตัวและเป็นค่าใน enum ไม่งั้น 400 `VALIDATION_ERROR` · ตอบ `[{id, slug, name, price, stock, direction, reason}]` เฉพาะต้นที่เปิดขาย เรียงตาม id · ไม่มีต้นที่ตรงตอบ `[]`

## สองภาษา (US-11 ที่เกี่ยวกับ feature นี้)
ข้อความอยู่ใน namespace `Cart` และ `FengShui` ของ `messages/{th,en}.json` (key ตรงกันตาม unit test) · หน้า `/en/cart`, `/en/feng-shui` ไม่มีอักษรไทยหลง (`i18n.spec.ts`)

## ข้อจำกัดที่รู้
- ถ้า `localStorage` เขียนไม่ได้ (โหมดส่วนตัวบางเบราว์เซอร์) ตะกร้าจะไม่ถูกเก็บ
- บนมือถือไม่มีเมนูใน header: ทางเข้า `/feng-shui` คือปุ่มบนหน้าแรก
