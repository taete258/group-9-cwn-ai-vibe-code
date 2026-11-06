# Data Model: แคตตาล็อกต้นไม้

ใช้โมเดลที่มีอยู่ใน [web/prisma/schema.prisma](../../web/prisma/schema.prisma) (ตาม spec.md ข้อ 5) **เพิ่มเพียงคอลัมน์ว่างได้ 3 ตัวใน `Tree` (`scientificName`, `originTh`, `originEn`) ตามคำขอหลังรีวิว UI — ไม่กระทบข้อมูลเดิม** และตัดตาราง `User`, `Address`, `CartItem`, `Order`, `OrderItem`, `OrderStatusLog` ออก (migration `remove_accounts_and_orders`) เพราะขอบเขต v0.4 ไม่มี login การสั่งซื้อ และแอดมิน

## Entities ที่ใช้

### Tree
| ฟิลด์ | ชนิด | กฎ/หมายเหตุ |
|---|---|---|
| id | int | PK |
| slug | string | ไม่ซ้ำ ใช้ใน URL ไม่ขึ้นกับภาษา |
| nameTh / nameEn | string | ต้องมีทั้งคู่ |
| descriptionTh / descriptionEn | string | ต้องมีทั้งคู่; คำอธิบายแบบยาว 5–7 ประโยค (ลักษณะ การเติบโต ที่มา ที่วางที่เหมาะ เคล็ดลับดูแล) |
| scientificName | string? | ชื่อวิทยาศาสตร์ ไม่ขึ้นกับภาษา; ว่างได้ → ซ่อนช่องนั้น (เพิ่มโดย migration `add_tree_scientific_and_origin`) |
| originTh / originEn | string? | แหล่งกำเนิดของพรรณไม้; ว่างได้ → ซ่อนช่องนั้น |
| species | FOLIAGE · FLOWERING · SUCCULENT · FRUIT · HERB | ใช้แถว "ตามสายพันธุ์" และตัวกรอง |
| size | S · M · L | ใช้แถว "ตามขนาด" และตัวกรอง |
| careLevel | EASY · MEDIUM · HARD | ตัวกรอง |
| lightTh/En, waterTh/En | string | แสดงในข้อมูลการดูแล |
| heightCm, potSizeInch | int? | ว่างได้ → ซ่อนช่องนั้น |
| petSafe | bool | ตัวกรอง "ปลอดภัยต่อสัตว์เลี้ยง" |
| price | int (สตางค์) | รวม VAT แล้ว แสดงผ่าน `formatBaht` |
| stock | int ≥ 0 | 0 → ป้าย "สินค้าหมด" (แสดงต้นไม้ แต่ไม่ซ่อน) |
| images | string[] | เรียงตามลำดับแสดง; อาจมีรูปเดียวหรือว่าง |
| isActive | bool | false → ไม่ปรากฏทั้งหน้าเว็บ รายการ ค้นหา และ API (หน้ารายละเอียดตอบ not found) |
| createdAt | datetime | ใช้เรียง "ใหม่ล่าสุด" (tie-break ด้วย id) |

### Collection / CollectionItem
- `Collection`: slug (ไม่ซ้ำ), nameTh/nameEn, `sortOrder` (ลำดับแถวหน้าแรก), `isActive`
- `CollectionItem`: (collectionId, treeId) PK, `sortOrder` (ลำดับต้นไม้ในแถว) — ต้นไม้ 1 ต้นอยู่ได้หลายหมวด
- หมวดไม่แสดงถ้า `isActive = false` หรือไม่มีต้นไม้ที่ `isActive` ในหมวด
- "สินค้าที่เกี่ยวข้อง": ต้นอื่นที่ active ใน **หมวดแรก** (เรียงตาม `sortOrder` ของ Collection) ที่ต้นนั้นสังกัด เรียงตาม `CollectionItem.sortOrder` สูงสุด 4 ต้น

### FengShui
- (treeId, room, direction, benefit, reasonTh, reasonEn) ต้นละ 0..n แถว
- หน้ารายละเอียดแสดงทุกแถวของต้นนั้นในกล่องเดียว; ไม่มีแถว → ซ่อนกล่อง
- `reasonTh/En` คือ "ความหมายมงคล" ที่ spec แสดงในกล่องฮวงจุ้ย
- enum ห้อง/ทิศ/เรื่อง **ไม่เก็บคำแปลใน DB** ใช้ key ใน `messages/*.json` (เช่น `Room.LIVING`, `Direction.SE`, `Benefit.WEALTH`)

## แถวบนหน้าแรก (ไม่ใช่ตาราง)

| แถว | ที่มา | ลิงก์ "ดูทั้งหมด" |
|---|---|---|
| หมวด (เสริมดวง ตกแต่ง ผักผลไม้) | `Collection` ที่ active เรียงตาม `sortOrder` | `/trees?collection=<slug>` |
| ตามขนาด S/M/L | `Tree.size` | `/trees?size=<S\|M\|L>` |
| ตามสายพันธุ์ 5 แบบ | `Tree.species` | `/trees?species=<ENUM>` |

แถวตามขนาด/สายพันธุ์ที่ไม่มีต้นไม้ active ไม่แสดง

## ข้อมูลตัวอย่าง (ข้อกำหนดการครอบคลุมของ 20 ต้น)

รายชื่อจริงกำหนดตอนเขียน `src/seed/catalog.ts` ต้องครอบคลุม:
- หมวด: เสริมดวง ≥ 5, ตกแต่ง ≥ 6, ผักผลไม้ ≥ 5 ต้น และมีอย่างน้อย 2 ต้นที่อยู่มากกว่าหนึ่งหมวด
- ขนาด: S, M, L อย่างน้อยขนาดละ 3 ต้น; สายพันธุ์: ครบ 5 แบบ; ระดับการดูแล: ครบ 3 ระดับ
- `petSafe` ทั้ง true และ false; `stock = 0` อย่างน้อย 1 ต้น และ `stock = 1` อย่างน้อย 1 ต้น (ข้อ 13.2); ต้นไม้ที่แสดงได้ (`isActive = true`) ครบ 20 ต้น และเพิ่มต้นที่ซ่อน (`isActive = false`) อีก 1 ต้น (รวม seed 21 แถว) ไว้ทดสอบว่าไม่ปรากฏในหน้าเว็บและ API
- หมวดทดสอบ: `archived` (ซ่อน แต่มีต้นไม้ active) และ `empty` (เปิดแต่ไม่มีต้นไม้ active) ต้องไม่แสดงบนหน้าแรก; ต้นไม้ที่ไม่มีรูป (`images = []`) อย่างน้อย 1 ต้น
- ฮวงจุ้ย: ครบ 6 ห้องและ 4 เรื่อง; อย่างน้อย 1 ต้นไม่มีข้อมูลฮวงจุ้ย
- รูป: อย่างน้อย 1 ต้นมีหลายรูป และ 1 ต้นมีรูปเดียว
- `slug` และ `id` ตายตัว ไม่เปลี่ยนระหว่าง seed ซ้ำ (upsert ตาม slug)

## State transitions

ไม่มี (ข้อมูลอ่านอย่างเดียวใน feature นี้)
