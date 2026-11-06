# Implementation Plan: แคตตาล็อกต้นไม้ (หน้าแรก ค้นหา รายละเอียด สองภาษา)

**Branch**: `002-catalog-browsing` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-catalog-browsing/spec.md`

## Summary

สร้างฝั่งลูกค้าแบบอ่านอย่างเดียวของร้าน: หน้าแรกแบ่งแถวตามหมวด/ขนาด/สายพันธุ์, หน้ารายการที่ค้นหา-กรอง-เรียงได้ผ่าน URL, หน้ารายละเอียดต้นไม้พร้อมกล่องฮวงจุ้ย และสองภาษา th/en พร้อมข้อมูลตัวอย่าง 20 ต้น

แนวทาง: ใช้โครงโปรเจกต์ใน `web/` ที่มีอยู่แล้ว (Next.js 16 App Router + next-intl + Prisma 7 + schema/migration เริ่มต้นตาม spec.md ข้อ 5) **แก้ schema เล็กน้อยตามคำขอหลังรีวิว UI: เพิ่ม `scientificName`/`originTh`/`originEn` และตัดตารางผู้ใช้/สั่งซื้อที่ขอบเขต v0.4 ไม่ใช้** หน้าเว็บเป็น Server Component อ่าน DB ผ่าน data layer เดียว และเปิดเผย `GET /api/home`, `/api/trees`, `/api/trees/[slug]` ตามสัญญาข้อ 7 และ 13.3 ตรรกะแปลง query → เงื่อนไข/ลำดับ และการแปลงข้อมูลเป็นภาษาเดียว เขียนเป็น pure function ใน `src/rules/` เพื่อทดสอบโดยไม่ต้องใช้ DB (constitution ข้อ V) ข้อมูลตัวอย่างเขียนเป็นโมดูลที่เรียกซ้ำได้ เพื่อให้ `/api/test/reset` ในอนาคตใช้ร่วมกันได้

## Technical Context

**Language/Version**: TypeScript 5, Node 24 (ตาม Dockerfile), React 19.3

**Primary Dependencies**: Next.js 16.4.5 (App Router, `cacheComponents` เปิดอยู่), next-intl 4, Prisma 7 + `@prisma/adapter-pg`, Tailwind CSS 4 + daisyUI 5 (คอมโพเนนต์ UI, เพิ่มตามคำขอผู้ใช้), Zod (เพิ่มใหม่ สำหรับ validate query ตาม spec §8)

**Storage**: PostgreSQL 16 (`compose.yml` service `db`) ใช้โมเดล `Tree`, `Collection`, `CollectionItem`, `FengShui` ที่มีใน `web/prisma/schema.prisma` แล้ว

**Testing**: Vitest (unit ของ `src/rules/`), Playwright (e2e ต่อ `docker compose`) — ทั้งสองเพิ่มเป็น devDependency ใน feature นี้ ตาม constitution ข้อ V

**Target Platform**: เว็บบนมือถือเป็นหลัก (375px) รันใน Docker Compose

**Project Type**: web application (Next.js เดียว หน้าเว็บและ API อยู่ใน `web/`)

**Performance Goals**: รูปทุกรูปแสดงผ่าน `next/image` (ไม่ได้วัดเวลาโหลดบน 4G ในรอบนี้)

**Constraints**: ไม่มีข้อความตายตัวในคอมโพเนนต์ (ใช้ `messages/{th,en}.json` key ตรงกัน), เงินเป็นสตางค์ แสดงผลด้วย `Intl`, ทุกหน้าอยู่ใต้ `/th` หรือ `/en`, ต้องใช้ `data-testid` ตามสัญญาข้อ 13.5, อ่านเอกสารใน `node_modules/next/dist/docs/` ก่อนใช้ API ของ Next 16 (ดู `web/AGENTS.md`)

**Scale/Scope**: ต้นไม้ 20 รายการ, 3 หมวด, 3 หน้าใหม่ (home/list/detail) + 3 endpoint อ่านอย่างเดียว; ไม่ทำแบ่งหน้า

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| หลักการ | สถานะ | หมายเหตุ |
|---|---|---|
| I. เงินเป็นสตางค์ ฟังก์ชันเดียว | ผ่าน | ราคาเก็บ/ส่งเป็น `Int` สตางค์; มี `formatBaht()` ตัวเดียวสำหรับแสดงผล `฿1,290.00` ทั้งสองภาษา (ไม่มีการคำนวณ VAT/ค่าส่งใน feature นี้ จึงยังไม่ต้องมีฟังก์ชันคำนวณ) |
| II. Server เป็นผู้ตัดสิน | ผ่าน | feature นี้ไม่มีการคำนวณราคา/quote (อยู่ใน feature ตะกร้า); query ถูก validate ที่ server ด้วย Zod (API ตอบ `400 VALIDATION_ERROR`, หน้าเว็บละเลยค่าผิด) |
| III. Test hook ใช้ได้เฉพาะตอนทดสอบ | ผ่าน | ไม่มีระบบบัญชี/login ทุกคนเป็น Guest และไม่เก็บข้อมูลส่วนบุคคล; ยังไม่มี `/api/test/*` ใน feature นี้; ต้นไม้ `isActive = false` ต้องไม่ถูกส่งออกทั้งหน้าเว็บและ API |
| IV. สองภาษาโดยโครงสร้าง | ผ่าน | ข้อความ UI อยู่ใน messages 2 ไฟล์; ข้อมูลต้นไม้เป็นคอลัมน์คู่ Th/En; มีเทสต์เทียบ key ของสองไฟล์ให้ตรงกัน |
| V. Test-first บนสัญญา | ผ่าน | `/api/trees` ใช้รูปตามข้อ 13.3 (`id, slug, name, price, stock, size, species`); `data-testid` ตามข้อ 13.5; เขียนเทสต์ก่อน implement ใน tasks |
| VI. เรียบง่าย | ผ่าน | ไม่ทำแบ่งหน้า ไม่ทำ cache ซับซ้อน ไม่ทำตะกร้า/สั่งซื้อ/login/แอดมิน; เพิ่มไลบรารีเฉพาะ Zod, Vitest, Playwright ที่ spec §8 ระบุไว้ |

**หลัง Phase 1**: ผ่านเหมือนเดิม ไม่มีข้อที่ต้องบันทึกใน Complexity Tracking

## Project Structure

### Documentation (this feature)

```text
specs/002-catalog-browsing/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── design/              # ต้นแบบ UI (Stitch) + design tokens
├── contracts/
│   ├── api.md           # GET /api/home, /api/trees, /api/trees/[slug]
│   └── ui.md            # routes, query params, data-testid
└── tasks.md             # Phase 2 (/speckit-tasks — ยังไม่สร้าง)
```

### Source Code (repository root)

```text
web/
├── messages/{th,en}.json            # ข้อความ UI (เพิ่ม key ของ Catalog/Tree/Filter/Lang)
├── prisma/
│   ├── schema.prisma                # ไม่แก้
│   └── seed.ts                      # ตัวเรียกจาก CLI (บาง ๆ)
├── public/trees/                    # รูปจำลอง (placeholder) ของต้นไม้ 20 ต้น
└── src/
    ├── i18n/navigation.ts           # createNavigation(routing) → Link/usePathname รักษา path+query ตอนสลับภาษา
    ├── rules/                       # pure function ห้ามแตะ DB (ตาม spec §8)
    │   ├── catalog-query.ts         # parse/validate query → CatalogQuery (Zod) + ค่าเริ่มต้น
    │   ├── localize.ts              # Tree/Collection/FengShui → ฟิลด์ภาษาเดียว (name, description, …)
    │   └── money.ts                 # formatBaht(satang, locale)
    ├── seed/catalog.ts              # ข้อมูล 20 ต้น + seedCatalog(db) เรียกซ้ำได้ (idempotent)
    ├── lib/catalog.ts               # data layer: getHomeRows, listTrees, getTreeBySlug, getRelated (Prisma)
    ├── app/
    │   ├── api/{home,trees,trees/[slug]}/route.ts
    │   └── [locale]/
    │       ├── layout.tsx           # + header (ชื่อร้าน, ลิงก์, lang-switch)
    │       ├── page.tsx             # หน้าแรก (แถวหมวด)
    │       ├── trees/page.tsx       # รายการ + ตัวกรอง
    │       ├── trees/[slug]/page.tsx
    │       └── not-found.tsx
    └── components/                  # TreeCard, CollectionRow, FilterBar, Gallery(client), FengShuiBox, LangSwitch
web/tests/
├── unit/                            # Vitest: rules/*, messages key parity
└── e2e/                             # Playwright: home, list/filter/search, detail, language
```

**Structure Decision**: ใช้แอป Next.js เดียวใน `web/` ตามที่ repo มีอยู่แล้ว (ไม่แยก frontend/backend) แยกตรรกะบริสุทธิ์ไว้ที่ `src/rules/` ตาม spec §8 และรวมการเข้าถึง DB ไว้ที่ `src/lib/catalog.ts` จุดเดียว ทั้งหน้าเว็บและ API เรียกจุดเดียวกัน

## Complexity Tracking

ไม่มี — ไม่มีการละเมิด constitution
