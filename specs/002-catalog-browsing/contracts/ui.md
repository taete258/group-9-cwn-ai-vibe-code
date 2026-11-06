# UI Contract: เส้นทางและตัวระบุทดสอบ

## เส้นทาง

| เส้นทาง | หน้า | หมายเหตุ |
|---|---|---|
| `/` | redirect → `/th` หรือ `/en` | ลำดับ cookie `NEXT_LOCALE` → `Accept-Language` → th (middleware next-intl) |
| `/{locale}` | หน้าแรก | `locale` = `th` \| `en`; ค่าอื่น → 404 |
| `/{locale}/trees` | รายการ + ตัวกรอง | query: `collection size species care petSafe q sort` (ตาม contracts/api.md; ค่าผิดถูกละเลย) |
| `/{locale}/trees/{slug}` | รายละเอียด | slug เหมือนกันทั้งสองภาษา; ไม่พบ/ซ่อน → หน้า not-found พร้อมทางกลับ |

## data-testid (ตามสัญญาข้อ 13.5 ห้ามเปลี่ยนชื่อ)

| testid | อยู่ที่ |
|---|---|
| `collection-row-<slug>` | แถวหมวดบนหน้าแรก (แถวขนาด/สายพันธุ์ใช้ `collection-row-size-<S\|M\|L>` / `collection-row-species-<ENUM>` — เพิ่มใหม่ ไม่ชนกับสัญญา) |
| `tree-card-<slug>` | การ์ดต้นไม้ (หน้าแรก รายการ และสินค้าที่เกี่ยวข้อง) |
| `search-input`, `filter-size`, `filter-species`, `filter-collection` | ค้นหาและตัวกรองในหน้ารายการ |
| `tree-price`, `tree-stock`, `feng-shui-box` | หน้ารายละเอียด (`feng-shui-box` ไม่ render เมื่อไม่มีข้อมูล) |
| `lang-switch` | ปุ่มสลับภาษาที่ header ทุกหน้า |
| `error-message` | ข้อความ not-found / ไม่พบผลลัพธ์ |

ตัวระบุที่เพิ่มเอง (ไม่อยู่ในสัญญา แต่จำเป็นต่อ e2e): `filter-care`, `filter-pet-safe`, `sort-select`, `related-tree`, `sold-out-badge`, `clear-filters`, `card-price` (ราคาบนการ์ด — `tree-price` สงวนไว้ให้หน้ารายละเอียดตามสัญญา), `filter-reset` (ปุ่มล้างในแผงตัวกรอง; `clear-filters` สงวนไว้ให้ปุ่มในสถานะไม่พบผลลัพธ์), `filter-clear-all`, `filter-toggle`, `result-count`, `plant-names` (ชื่อไทย/อังกฤษ/วิทยาศาสตร์/แหล่งกำเนิด), `tree-description`, `care-info`, `gallery`, `gallery-thumb`, `gallery-zoom`, `gallery-dialog`, `gallery-next`, `gallery-placeholder`

`<body data-bug-mode>` ยังอยู่ใน layout (อ่านจาก `BUG_MODE`) แต่ไม่มีโหมดบั๊กใดถูกใช้งานในรอบนี้
