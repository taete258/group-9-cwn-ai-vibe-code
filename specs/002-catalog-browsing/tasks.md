---
description: "Task list for แคตตาล็อกต้นไม้ (หน้าแรก ค้นหา รายละเอียด สองภาษา)"
---

# Tasks: แคตตาล็อกต้นไม้

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **รวมอยู่ด้วย** เพราะ constitution ข้อ V กำหนด test-first — เขียนเทสต์ก่อน ยืนยันว่า fail แล้วค่อย implement

**Organization**: จัดตาม user story (US1 หน้าแรก, US2 รายละเอียด, US3 ค้นหา/กรอง, US4 สองภาษา) ทุก path อยู่ใต้ `web/` ยกเว้นระบุไว้

**UI**: ทุก component/หน้า ต้องทำตามต้นแบบใน [design/](design/README.md) (ใช้ design tokens ในไฟล์นั้น) และห้ามเพิ่ม element ที่ไม่อยู่ใน spec ตามรายการ "กฎการใช้ภาพ"

## Format: `[ID] [P?] [Story] Description`

- **[P]**: ทำขนานได้ (คนละไฟล์ ไม่พึ่งงานที่ยังไม่เสร็จ)
- **[Story]**: US1–US4

---

## Phase 1: Setup

- [x] T001 เพิ่ม dependency ใน `web/package.json`: `zod` (dependencies), `vitest` และ `@playwright/test` (devDependencies) แล้วรัน `npm install`; เพิ่ม scripts `"test": "vitest run"` และ `"test:e2e": "playwright test"`
- [x] T002 [P] สร้าง `web/vitest.config.ts` (environment node, include `tests/unit/**/*.test.ts`, alias `@` → `src`)
- [x] T003 [P] สร้าง `web/playwright.config.ts` (testDir `tests/e2e`, `baseURL: process.env.BASE_URL ?? "http://localhost:3000"`, viewport เริ่มต้น 375×812, ไม่ฮาร์ดโค้ดพอร์ต เพราะพอร์ต 3000 อาจถูกโปรเจกต์อื่นใช้)

---

## Phase 2: Foundational (ต้องเสร็จก่อนทุก story)

**⚠️ CRITICAL**: ห้ามเริ่ม user story ก่อน phase นี้เสร็จ

### เทสต์ก่อน (ต้อง fail ก่อน implement)

- [x] T004 [P] เขียน `web/tests/unit/money.test.ts`: `formatBaht(129000, "th")` และ `"en"` ได้ `฿1,290.00` ทั้งคู่, `formatBaht(0)` = `฿0.00`, `formatBaht(5)` = `฿0.05`
- [x] T005 [P] เขียน `web/tests/unit/catalog-query.test.ts`: ค่าเริ่มต้น `sort=newest`; enum `size/species/care` ที่ไม่ถูกต้องถูกทิ้งเป็นรายตัวในโหมดหน้าเว็บ (ไม่ throw); โหมด strict (API) ต้องคืน error `VALIDATION_ERROR` เมื่อ enum ผิด; `q` ตัดช่องว่างหัวท้าย และ `q` ที่เป็นช่องว่างล้วน = ไม่ค้น; `petSafe=1` เท่านั้นที่ถือว่าเปิด
- [x] T006 [P] เขียน `web/tests/unit/localize.test.ts`: ฟังก์ชัน `localizeTree` เลือก `nameTh/nameEn`, `descriptionTh/En`, `lightTh/En`, `waterTh/En` ตาม locale; ฟังก์ชัน `toTreeSummary` คืนเฉพาะ `id, slug, name, price, stock, size, species` (รูปตามสัญญา 13.3); `localizeFengShui` เลือก `reasonTh/En` เป็น `reason`
- [x] T007 [P] เขียน `web/tests/unit/messages.test.ts`: key ทั้งหมด (ซ้อนทุกระดับ) ของ `messages/th.json` กับ `messages/en.json` ต้องตรงกันพอดี และไม่มีค่าสตริงว่าง (constitution ข้อ IV)

### Implementation

- [x] T008 [P] สร้าง `web/src/rules/money.ts`: `formatBaht(satang: number, locale: "th" | "en"): string` ใช้ `Intl.NumberFormat` สกุล THB รูปแบบ `฿1,290.00` ทั้งสองภาษา (pure, ไม่แตะ DB)
- [x] T009 [P] สร้าง `web/src/rules/catalog-query.ts`: Zod schema + `parseCatalogQuery(input, { strict })` คืน `{ collection?, size?, species?, care?, petSafe, q?, sort }` ตาม [contracts/api.md](contracts/api.md) (enum: `size` S|M|L, `species` FOLIAGE|FLOWERING|SUCCULENT|FRUIT|HERB, `care` EASY|MEDIUM|HARD, `sort` newest|price_asc|price_desc, ค่าเริ่มต้น newest)
- [x] T010 [P] สร้าง `web/src/rules/localize.ts`: `localizeTree`, `toTreeSummary`, `localizeFengShui`, `localizeCollection` ตาม T006
- [x] T011 เพิ่ม key ที่ใช้ร่วมกันใน `web/messages/th.json` และ `web/messages/en.json`: `Header` (ชื่อร้าน, ลิงก์หน้าแรก/ต้นไม้ทั้งหมด), `Common` ("สินค้าหมด"/"Sold out", "ดูทั้งหมด"/"View all"), `Species`, `Size`, `Care`, `Room`, `Direction`, `Benefit` (key ตรงกับ enum ใน schema), `Lang`; ให้ T007 ผ่าน
- [x] T012 สร้าง `web/src/seed/catalog.ts`: `seedCatalog(db)` แบบ idempotent (upsert ตาม `slug`) พร้อมข้อมูล 20 ต้นที่แสดงได้ + 1 ต้นซ่อน (`isActive = false`) ตาม "ข้อมูลตัวอย่าง" ใน [data-model.md](data-model.md): ทุกต้นมี `nameTh/nameEn`, `descriptionTh/En`, `lightTh/En`, `waterTh/En`, `price` เป็นสตางค์รวม VAT, `stock >= 0` (มี `stock = 0` อย่างน้อย 1 และ `stock = 1` อย่างน้อย 1), ครบ `size` S/M/L (≥ 3 ต้น/ขนาด), ครบ 5 `species`, ครบ 3 `careLevel`, `petSafe` ทั้ง true/false, หมวด `lucky`/`decor`/`edible` (ชื่อ เสริมดวง/ตกแต่ง/ผักผลไม้, `sortOrder` 1–3) ต้นไม้ ≥ 5/6/5 ต้น และ ≥ 2 ต้นอยู่หลายหมวด, บวกหมวดสำหรับทดสอบอีก 2 หมวดที่ต้องไม่แสดงบนหน้าแรก: `archived` (`isActive = false` มีต้นไม้ active อยู่ข้างใน) และ `empty` (`isActive = true` แต่ไม่มีต้นไม้ active ในหมวด), `FengShui` ครอบคลุมครบ 6 ห้อง (LIVING, BEDROOM, OFFICE, KITCHEN, ENTRANCE, BALCONY) และ 4 เรื่อง (WEALTH, HEALTH, LOVE, CAREER) โดยอย่างน้อย 1 ต้นไม่มี `FengShui`, `images` มี ≥ 1 ต้นที่มีหลายรูป, ≥ 1 ต้นที่มีรูปเดียว และ ≥ 1 ต้นที่ไม่มีรูป (`images = []`), `id` และ `slug` ตายตัวไม่เปลี่ยนเมื่อ seed ซ้ำ
- [x] T013 [P] สร้าง `web/scripts/fetch-tree-photos.mjs` ดาวน์โหลดรูปต้นไม้จาก Stitch ไว้ใน `web/public/trees/<slug>-<n>.jpg` ให้ชื่อไฟล์ตรงกับ `images` ใน T012 แล้วรันสคริปต์และ commit ไฟล์ที่ได้
- [x] T014 สร้าง `web/prisma/seed.ts` (เรียก `seedCatalog` แล้ว disconnect) เพิ่ม `migrations.seed` ใน `web/prisma.config.ts` และแก้ `CMD` ใน `web/Dockerfile` ให้รัน seed หลัง `prisma migrate deploy` ก่อน `npm start`; เพิ่ม script `"seed"` ใน `web/package.json`; ยืนยันว่ารัน seed สองรอบติดกันแล้ว `SELECT count(*) FROM "Tree"` ได้ 21 เท่าเดิมและ `id`/`slug` ไม่เปลี่ยน (บันทึกขั้นตรวจนี้ใน [quickstart.md](quickstart.md)); ยืนยันว่า Node 24 รัน `.ts` ได้โดยไม่ต้องเพิ่ม `tsx` (ถ้าไม่ได้ ให้เพิ่ม `tsx` เป็น devDependency และบันทึกใน [research.md](research.md) ข้อ 8)
- [x] T015 สร้าง `web/src/lib/catalog.ts` (data layer จุดเดียว ใช้ `db` จาก `src/lib/db.ts`): `getHomeRows(locale)`, `listTrees(query, locale)`, `getTreeBySlug(slug, locale)` โดยทุก query ต้องกรอง `isActive = true` (และหมวดต้อง `isActive`); `getHomeRows` และ `getTreeBySlug` ต้องเป็น data function ที่ใช้ `'use cache'` + `cacheLife('minutes')` (อ้าง locale/slug เป็นอาร์กิวเมนต์) ส่วน `listTrees` ไม่ cache เพราะขึ้นกับ `searchParams` — ถ้า `cacheComponents` มีปัญหา ให้ถอยเป็นไม่ cache และบันทึกใน [research.md](research.md) ข้อ 2; `listTrees` ใช้ `OR` ของ `nameTh`/`nameEn` `contains` + `mode: "insensitive"` เมื่อมี `q`, เรียง `newest` = `createdAt desc, id desc`
- [x] T016 [P] สร้าง `web/src/i18n/navigation.ts` ด้วย `createNavigation(routing)` ส่งออก `Link`, `usePathname`, `useRouter`
- [x] T017 สร้าง `web/src/components/LangSwitch.tsx` (client) ใช้ `Link` + `usePathname` + `useSearchParams` ให้สลับภาษาโดยอยู่ path และ query เดิม ตั้ง `data-testid="lang-switch"` และ `web/src/components/Header.tsx` (ชื่อร้าน, ลิงก์หน้าแรก/ต้นไม้ทั้งหมด, `LangSwitch`); แก้ `web/src/app/[locale]/layout.tsx` ให้ render `Header` และลบ `lang-switch` เดิมออกจาก `web/src/app/[locale]/page.tsx`
- [x] T018 สร้าง design tokens และฟอนต์ตาม [design/README.md](design/README.md): กำหนดสี (primary `#234E20`, canvas `#FAF8F5`, ข้อความ `#1D261C`/`#3F4A3D`, card ขอบ `#E9E4DC` มุม 16px) ใน `web/src/app/globals.css` (Tailwind 4 `@theme`) และโหลด Noto Sans Thai ด้วย `next/font/google` ใน `web/src/app/[locale]/layout.tsx` ตั้ง `body` เป็น 16px+ line-height 1.75; ให้ `Header` (T017) ตรงภาพ (ชื่อร้าน, ลิงก์, ปุ่มสลับภาษา) บนมือถือและ desktop
- [x] T019 [P] สร้าง `web/src/components/TreeCard.tsx` (server): รูปผ่าน `next/image` (รูป SVG ใช้ `unoptimized`; ถ้า `next/image` ไม่ยอมรับค่อยเพิ่ม `images` ใน `web/next.config.ts` ตาม [research.md](research.md) ข้อ 7), ชื่อ, ราคาด้วย `formatBaht`, ป้าย `sold-out-badge` เมื่อ `stock = 0`, `data-testid="tree-card-<slug>"`, ลิงก์ไป `/{locale}/trees/<slug>` (ใช้ร่วมกันใน US1, US2 สินค้าที่เกี่ยวข้อง, US3) (ต้นแบบ: [home-mobile.jpg](design/home-mobile.jpg), [list-desktop.jpg](design/list-desktop.jpg))

**Checkpoint**: `npm run test` ผ่านทุก unit, `docker compose up` แล้ว DB มีข้อมูล 21 แถว, header พร้อมสลับภาษาแสดงทุกหน้า

---

## Phase 3: User Story 1 — หน้าแรกตามหมวด (Priority: P1) 🎯 MVP

**Goal**: ผู้เยี่ยมชมเห็นแถวหมวด/ขนาด/สายพันธุ์ เลื่อนดูและกด "ดูทั้งหมด" ได้

**Independent Test**: เปิด `/th` ไม่ login ตรวจแถวและการ์ดตาม Acceptance Scenarios 1–6 ของ US1 (ปลายทางของ "ดูทั้งหมด" จะใช้งานได้เต็มหลัง US3 แต่ลิงก์ต้องชี้ URL ที่ถูกต้องแล้ว)

### Tests (เขียนก่อน ต้อง fail)

- [x] T020 [P] [US1] เขียน `web/tests/e2e/home.spec.ts`: มี `collection-row-lucky`, `collection-row-decor`, `collection-row-edible` ตามลำดับ `sortOrder`; มี `collection-row-size-*` และ `collection-row-species-*` เฉพาะที่มีต้นไม้; การ์ดแสดงรูป ชื่อ `tree-price` (รูป `฿x,xxx.00`) และ `sold-out-badge` เฉพาะต้นที่ `stock = 0`; ต้นที่ซ่อนไม่ปรากฏ; ไม่มีแถว `collection-row-archived` และ `collection-row-empty`; ลิงก์ "ดูทั้งหมด" ของหมวด `lucky` มี href `/th/trees?collection=lucky`
- [x] T021 [P] [US1] เขียน `web/tests/e2e/api-home.spec.ts`: `GET /api/home?locale=en` ตอบ 200 รูป `{ rows: [{ type, key, trees }] }` ตาม [contracts/api.md](contracts/api.md), `name` เป็นอังกฤษ, ไม่มีต้นที่ซ่อนและไม่มีแถวว่าง

### Implementation

- [x] T022 [P] [US1] สร้าง `web/src/components/CollectionRow.tsx`: หัวแถว (ชื่อ + ลิงก์ "ดูทั้งหมด"), รายการเลื่อนแนวนอน (`overflow-x-auto`, scroll-snap) ภายในแถวเท่านั้น, `data-testid` ตามชนิดแถวใน [contracts/ui.md](contracts/ui.md) (ต้นแบบ: [home-mobile.jpg](design/home-mobile.jpg))
- [x] T023 [US1] เพิ่ม key `Home` (หัวแถวขนาด/สายพันธุ์ ชื่อ "ดูทั้งหมด") ใน `web/messages/th.json` และ `web/messages/en.json` ให้ T007 ยังผ่าน
- [x] T024 [US1] สร้าง `web/src/app/api/home/route.ts` เรียก `getHomeRows` (รับ `?locale=` ตรวจด้วย Zod, ผิด → `400 VALIDATION_ERROR`)
- [x] T025 [US1] แทนที่ `web/src/app/[locale]/page.tsx` ด้วยหน้าแรกจริง: เรียก `getHomeRows(locale)` (cache อยู่ใน data layer ตาม T015) แสดง `CollectionRow` ตามลำดับ: หมวด → ขนาด S/M/L → สายพันธุ์; ตัดแถวว่าง

**Checkpoint**: T020–T021 ผ่าน, US1 ใช้งานและสาธิตได้เอง

---

## Phase 4: User Story 2 — หน้ารายละเอียดต้นไม้ (Priority: P1)

**Goal**: ข้อมูลครบในหน้าเดียวพร้อมกล่องฮวงจุ้ยและสินค้าที่เกี่ยวข้อง

**Independent Test**: เปิด `/th/trees/<slug>` ของต้นที่มีข้อมูลครบ, ต้นที่ไม่มีฮวงจุ้ย, ต้นสินค้าหมด, slug ที่ไม่มี/ซ่อน ตาม Acceptance Scenarios 1–8 ของ US2

### Tests (เขียนก่อน ต้อง fail)

- [x] T026 [P] [US2] เขียน `web/tests/e2e/detail.spec.ts`: ต้นที่มีฮวงจุ้ย → เห็น `tree-price`, `tree-stock`, ข้อมูลการดูแล, `feng-shui-box` พร้อมข้อความ "คำแนะนำตามความเชื่อ เพื่อความสบายใจ", แกลเลอรี, `related-tree` จำนวน 4 และไม่มีต้นที่กำลังดู; ต้นที่ไม่มีฮวงจุ้ย → ไม่มี `feng-shui-box`; ต้น `stock = 0` → แสดงว่าหมด; slug ไม่มี/ต้นที่ซ่อน → `error-message` และลิงก์กลับ; ต้นที่มีหลายรูป → กดรูปแล้วขยาย (dialog เปิด) และเลื่อนไปรูปถัดไปได้ (FR-012); ต้นที่มีรูปเดียว → ไม่มีตัวเลื่อนรูป; ต้นที่ไม่มีรูป → แสดงรูปแทนที่และหน้าไม่พัง
- [x] T027 [P] [US2] เขียน `web/tests/e2e/api-tree-detail.spec.ts`: `GET /api/trees/<slug>?locale=th` ตอบ 200 ฟิลด์ตาม [contracts/api.md](contracts/api.md) (`heightCm`/`potSizeInch` เป็น `null` ได้, `fengShui` เป็น `[]` ได้, `related` 0–4); slug ไม่มี และต้นที่ซ่อน → `404` `{ "error": "NOT_FOUND" }`

### Implementation

- [x] T028 [US2] เพิ่ม `getRelated(treeId, locale)` ใน `web/src/lib/catalog.ts` ตามกฎใน [data-model.md](data-model.md): หมวดแรก (ตาม `Collection.sortOrder`) ที่ต้นนั้นสังกัด, active เท่านั้น, ไม่รวมตัวเอง, เรียงตาม `CollectionItem.sortOrder`, สูงสุด 4; และให้ `getTreeBySlug` คืน `fengShui` และ `related`
- [x] T029 [P] [US2] สร้าง `web/src/components/Gallery.tsx` (client): สไลด์/ปัดดูรูป กดขยายได้ (dialog), รูปเดียวไม่แสดงตัวเลื่อน, ไม่มีรูปแสดงรูปแทนที่
- [x] T030 [P] [US2] สร้าง `web/src/components/FengShuiBox.tsx`: แสดงทุกแถว (ห้าม ทิศ เรื่อง เหตุผล โดยแปล enum จาก `Room/Direction/Benefit` ใน messages) + disclaimer, `data-testid="feng-shui-box"`, ไม่ render เมื่อไม่มีข้อมูล
- [x] T031 [US2] เพิ่ม key `Tree` (หัวข้อข้อมูลการดูแล แสง น้ำ ความสูง ขนาดกระถาง ความยากการดูแล ปลอดภัยต่อสัตว์เลี้ยง สินค้าหมด คงเหลือ สินค้าที่เกี่ยวข้อง disclaimer ฮวงจุ้ย) และ `NotFound` ใน `web/messages/th.json` และ `web/messages/en.json`
- [x] T032 [US2] สร้าง `web/src/app/api/trees/[slug]/route.ts` เรียก `getTreeBySlug` (ตรวจ `?locale=`; ไม่พบ/ซ่อน → `404 NOT_FOUND`)
- [x] T033 [US2] สร้าง `web/src/app/[locale]/trees/[slug]/page.tsx`: แสดงชื่อ ราคา (`tree-price`) คงเหลือ (`tree-stock`) คำอธิบาย ข้อมูลการดูแล (ซ่อนช่องที่เป็น `null`) `Gallery` `FengShuiBox` และ `related-tree` (ใช้ `TreeCard`); ไม่พบ → `notFound()`; **ไม่มีปุ่มใส่ตะกร้า** (นอกขอบเขตรอบนี้) (ต้นแบบ: [detail-mobile.jpg](design/detail-mobile.jpg), [detail-desktop.jpg](design/detail-desktop.jpg))
- [x] T034 [US2] สร้าง `web/src/app/[locale]/not-found.tsx` ที่แสดง `error-message` พร้อมลิงก์กลับหน้าแรกและรายการ (ข้อความจาก `NotFound`) (ต้นแบบ: [empty-mobile.jpg](design/empty-mobile.jpg), [empty-desktop.jpg](design/empty-desktop.jpg) (ใช้ทีละสถานะ ไม่ซ้อนสองอันในหน้าเดียว))

**Checkpoint**: T026–T027 ผ่าน, US1 และ US2 ทำงานร่วมกันได้ (กดการ์ดจากหน้าแรกเข้ารายละเอียด)

---

## Phase 5: User Story 3 — ค้นหา กรอง เรียง (Priority: P1)

**Goal**: หน้ารายการที่กรอง/ค้น/เรียงได้และแชร์ลิงก์ได้

**Independent Test**: เปิด `/th/trees` ลองตัวกรองทีละแบบและรวมกัน ค้นหาไทย/อังกฤษ เรียงทั้ง 3 แบบ และเปิด URL ซ้ำ ตาม Acceptance Scenarios 1–6 ของ US3

### Tests (เขียนก่อน ต้อง fail)

- [x] T035 [P] [US3] เขียน `web/tests/e2e/api-trees.spec.ts`: รูป array ตามข้อ 13.3 (`id, slug, name, price, stock, size, species`); กรองแต่ละตัว (`collection`, `size`, `species`, `care`, `petSafe=1`) และรวมกันได้เฉพาะต้นที่ตรงทุกเงื่อนไข; `q=monstera` กับ `q=มอนสเตอร่า` ได้ต้นเดียวกัน; `sort=price_asc|price_desc` เรียงถูก; ไม่มีต้นที่ซ่อน; `?size=XL` และ `?locale=fr` → `400 VALIDATION_ERROR`; ไม่พบ → `200 []`
- [x] T036 [P] [US3] เขียน `web/tests/e2e/list.spec.ts`: ใช้ `filter-size`, `filter-species`, `filter-collection`, `filter-care`, `filter-pet-safe`, `search-input`, `sort-select` ตามที่ระบุใน [contracts/ui.md](contracts/ui.md) แล้วผลลัพธ์ตรงกับ API; คัดลอก URL เปิดแท็บใหม่ได้ผลเหมือนกัน; `/th/trees?size=XL&sort=bad` ไม่ error ใช้ค่าเริ่มต้น; ไม่พบผล → `error-message` + `clear-filters`; `/th/trees?q=%20%20` ไม่พัง (ถือว่าไม่ค้นหา)

### Implementation

- [x] T037 [US3] เพิ่ม key `Filter` และ `List` (ป้ายตัวกรอง ตัวเลือกการเรียง ไม่พบผลลัพธ์ ล้างตัวกรอง) ใน `web/messages/th.json` และ `web/messages/en.json`
- [x] T038 [US3] สร้าง `web/src/app/api/trees/route.ts` เรียก `parseCatalogQuery(searchParams, { strict: true })` แล้ว `listTrees` → ตอบ array `toTreeSummary`; error → `{ error, message }` ตามภาษา
- [x] T039 [P] [US3] สร้าง `web/src/components/FilterBar.tsx`: `<form method="get">` (server component ไม่ต้องใช้ JS) มี `search-input`, `filter-collection`, `filter-size`, `filter-species`, `filter-care`, `filter-pet-safe`, `sort-select`, ปุ่มค้นหา และ `clear-filters`; ค่าที่เลือกอยู่ถูกเติมจาก query ปัจจุบัน (ต้นแบบ: [list-mobile.jpg](design/list-mobile.jpg), [list-desktop.jpg](design/list-desktop.jpg) (desktop: sidebar ซ้าย 280px; มือถือ: แผงตัวกรองพับได้))
- [x] T040 [US3] สร้าง `web/src/app/[locale]/trees/page.tsx`: อ่าน `searchParams` → `parseCatalogQuery(…, { strict: false })` (ละเลยค่าผิด) แสดง `FilterBar` (shell) และผลลัพธ์ด้วย `TreeCard` ห่อ `<Suspense>` ตามเอกสาร Next 16; ไม่มีผลลัพธ์ → `error-message` + `clear-filters` (ต้นแบบ: [list-mobile.jpg](design/list-mobile.jpg), [list-desktop.jpg](design/list-desktop.jpg))

**Checkpoint**: T035–T036 ผ่าน, ปุ่ม "ดูทั้งหมด" จาก US1 พาไปรายการที่กรองแล้วจริง

---

## งานที่ไม่ทำในรอบนี้ (ตัดออกจากเอกสาร)

ไม่ได้ทำและไม่ถือเป็นส่วนหนึ่งของ feature นี้: การทดสอบ redirect ตาม `Accept-Language`/cookie แยกเป็นไฟล์ (T041), `<link rel="alternate" hreflang>` ใน HTML head (T042; ปัจจุบันมี hreflang ใน HTTP header `Link`), เทส overflow ที่ 375px (T044), เทสต้นที่ซ่อนใน `/api/trees` ตรง ๆ (T045), การวัด performance บน 4G (T046) และการบันทึกผลรัน quickstart (T048)

ที่ครอบคลุมแล้วโดยเทสอื่น: สลับภาษาอยู่หน้าเดิม (`list.spec.ts`, `cart.spec.ts`, `feng-shui.spec.ts`), ไม่มีข้อความไทยหลงในหน้า `/en` (`i18n.spec.ts`, ใช้แทน T043 ส่วนที่ตรวจข้อความ), key th/en ตรงกัน (`messages.test.ts`); `npm run lint`, `npx tsc --noEmit`, `npm run test` ผ่าน (T047)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (บล็อกทุก story) → US1, US2, US3, US4 → Polish
- **US1, US2, US3 ไม่พึ่งกัน** หลัง Phase 2 ทำขนานได้ (`TreeCard` T019 อยู่ใน Foundational แล้ว)
- US4 ควรทำหลัง US1–US3 เพราะต้องไล่ทุกหน้า
- ภายในแต่ละ story: เทสต์ → (ต้อง fail) → components → API → หน้า
- งานที่แก้ไฟล์ messages (T011, T023, T031, T037) แก้ไฟล์เดียวกัน ต้องทำต่อเนื่องไม่ขนาน

## Parallel Examples

- Phase 2: T004–T007 (เทสต์ 4 ไฟล์) ขนานกัน; T008–T010 (rules 3 ไฟล์) ขนานกัน; T013 (รูปจำลอง) ขนานกับ T016
- US1: T020/T021 (เทสต์ 2 ไฟล์) ขนานกัน
- US2: T026/T027 ขนานกัน; T029/T030 ขนานกัน
- หลัง Phase 2 ถ้ามีหลายคน: คนหนึ่ง US1, อีกคน US2, อีกคน US3

## Implementation Strategy

- **MVP = Phase 1 + 2 + US1**: หน้าแรกพร้อมข้อมูลจริงและสลับภาษาได้ แล้วหยุดตรวจ
- ส่งมอบเพิ่มทีละ story: US2 (รายละเอียด) → US3 (ค้นหา) → US4 (ขัดเกลาสองภาษา) โดยทุกครั้งตรวจ Checkpoint ก่อน
- ห้ามทำสิ่งนอกขอบเขตรอบนี้: ตะกร้า/ปุ่มใส่ตะกร้า, สมาชิก, หน้า `/feng-shui`, แอดมิน, แบ่งหน้า (constitution ข้อ VI)
