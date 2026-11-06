# API Contract: แคตตาล็อก (อ่านอย่างเดียว)

อิงสัญญาใน `spec.md` ข้อ 7 และ 13 ห้ามเปลี่ยนชื่อ path ชื่อฟิลด์ หรือ error code ที่ระบุไว้ เพิ่มฟิลด์ได้

ข้อกำหนดร่วม: ไม่ต้อง login · `?locale=th|en` (ค่าเริ่มต้น `th`; ค่าอื่น → `400 VALIDATION_ERROR`) เลือกภาษาของข้อความ · เงินเป็นสตางค์ (integer) เสมอ · ไม่ส่งต้นไม้ที่ `isActive = false` · error ตอบ `{ "error": "<CODE>", "message": "<ข้อความตาม locale>" }`

## GET /api/trees

Query (ทุกตัวไม่บังคับ):

| พารามิเตอร์ | ค่า | หมายเหตุ |
|---|---|---|
| `collection` | slug ของหมวด | หมวดที่ไม่มี/ซ่อน → ผลลัพธ์ว่าง |
| `size` | `S` `M` `L` | |
| `species` | `FOLIAGE` `FLOWERING` `SUCCULENT` `FRUIT` `HERB` | |
| `care` | `EASY` `MEDIUM` `HARD` | |
| `petSafe` | `1` | ใส่ = เฉพาะต้นที่ปลอดภัย |
| `q` | ข้อความ | ค้นชื่อไทย **และ** อังกฤษ ไม่แยกตัวพิมพ์ ตัดช่องว่างหัวท้าย; ว่าง = ไม่ค้น |
| `sort` | `newest` (ค่าเริ่มต้น) · `price_asc` · `price_desc` | |

ตอบ `200`: array เรียงตาม `sort`

```json
[{ "id": 1, "slug": "monstera", "name": "มอนสเตอร่า", "price": 129000, "stock": 5, "size": "M", "species": "FOLIAGE" }]
```

- `name` เป็นภาษาตาม `locale`; `price` รวม VAT แล้ว (สตางค์)
- ค่า enum ใน query ที่ไม่รู้จัก → `400 VALIDATION_ERROR` (หน้าเว็บใช้ schema เดียวกันแต่ **ละเลย** ค่าผิดตาม FR-009)
- ไม่พบ → `200` `[]`

## GET /api/trees/[slug]

ตอบ `200`:

```json
{
  "id": 1, "slug": "monstera", "name": "…", "nameTh": "มอนสเตอร่า", "nameEn": "Monstera",
  "scientificName": "Monstera deliciosa", "origin": "…", "description": "…",
  "price": 129000, "stock": 5, "size": "M", "species": "FOLIAGE", "careLevel": "EASY",
  "light": "…", "water": "…", "heightCm": 60, "potSizeInch": 8, "petSafe": false,
  "images": ["/trees/monstera-1.jpg"],
  "fengShui": [{ "room": "LIVING", "direction": "SE", "benefit": "WEALTH", "reason": "…" }],
  "related": [{ "id": 2, "slug": "…", "name": "…", "price": 0, "stock": 0, "size": "M", "species": "FOLIAGE" }]
}
```

- `nameTh`, `nameEn` ส่งทั้งคู่เสมอ (`name` เป็นภาษาตาม `locale`); `scientificName` และ `origin` (ตาม `locale`) เป็น `null` ได้
- `heightCm`, `potSizeInch` เป็น `null` ได้; `fengShui` เป็น `[]` ได้; `related` มี 0–4 รายการ ไม่รวมต้นนี้
- slug ไม่มีหรือซ่อน → `404 NOT_FOUND`

## GET /api/home

ตอบ `200`: แถวตามลำดับที่แสดงบนหน้าแรก

```json
{ "rows": [
  { "type": "collection", "key": "lucky", "name": "เสริมดวง", "trees": [ /* รูปแบบเดียวกับ /api/trees */ ] },
  { "type": "size", "key": "S", "trees": [] },
  { "type": "species", "key": "FOLIAGE", "trees": [] }
] }
```

- แถวที่ไม่มีต้นไม้ active ถูกตัดออก; `name` มีเฉพาะแถวชนิด `collection` (ชื่อขนาด/สายพันธุ์แปลที่ฝั่ง UI จาก key)
