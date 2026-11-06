# Research: แคตตาล็อกต้นไม้

ไม่มี `NEEDS CLARIFICATION` ใน Technical Context ไฟล์นี้บันทึกการตัดสินใจเชิงเทคนิคที่ต้องเลือก

## 1. ใช้ Server Component อ่าน DB ตรง หรือให้หน้าเรียก API

- **Decision**: หน้าเว็บ (Server Component) เรียก `src/lib/catalog.ts` ตรง ส่วน `/api/home`, `/api/trees`, `/api/trees/[slug]` เป็นชั้นบาง ๆ เรียก data layer เดียวกัน
- **Rationale**: spec §7 ระบุว่า Server Component อ่าน DB ตรงได้ และ API จำเป็นเพราะสัญญาข้อ 13.3 (`GET /api/trees`) ที่ test ใช้ การใช้ data layer เดียวกันทำให้หน้ากับ API ให้ผลตรงกันเสมอ
- **Alternatives**: ให้หน้า fetch จาก API ของตัวเอง — เพิ่ม hop และต้องจัดการ URL ฐาน โดยไม่ได้ประโยชน์

## 2. Cache Components (`cacheComponents: true`) กับหน้าที่อ่าน `searchParams`

- **Decision**: หน้ารายการอ่าน `searchParams` จึงเป็นข้อมูลระดับ request: ห่อส่วนผลลัพธ์ด้วย `<Suspense>` ให้ shell (header, ฟอร์มกรอง) ขึ้นก่อน หน้าแรกและหน้ารายละเอียดใช้ data function ที่ `'use cache'` + `cacheLife('minutes')` เพราะข้อมูลเปลี่ยนเฉพาะตอน seed/แอดมิน (ภายหลังใช้ `revalidateTag`)
- **Rationale**: ตามเอกสาร Next 16 (`01-app/01-getting-started/08-caching.md`) `searchParams` อ่านนอก `use cache` ได้ถ้าห่อ Suspense; ช่วยให้ผ่านเป้า 2 วินาที ไม่ต้องคำนวณใหม่ทุก request
- **ผลตอนทำจริง (US1)**: ใช้ทางสำรอง "ไม่ cache" — Docker build ไม่มี DB แต่หน้าถูก prerender ตอน `next build` ถ้าใช้ `'use cache'` กับข้อมูลจาก DB build จะพัง จึงห่อส่วนข้อมูลด้วย `<Suspense>` ให้ shell prerender และคอนเทนต์ stream ตอน request (build แสดงเป็น Partial Prerender) ถ้าวัดแล้วไม่ผ่าน SC-002 ค่อยเพิ่ม cache พร้อม `revalidateTag`
- ข้อควรระวังจาก build: ห้ามใช้ `new Date()`/เวลาปัจจุบันใน layout หรือหน้า prerender (ทั้งขัด constitution ข้อ V) ใช้ `now()` ใน request-time เท่านั้น
- **Alternatives**: ไม่ cache เลย — ง่ายสุดและยังผ่านเป้ากับข้อมูล 20 รายการ; เลือก cache เฉพาะหน้าแรก/รายละเอียดเพราะต้นทุนต่ำ ถ้า implement แล้วมีปัญหากับ `cacheComponents` ให้ถอยเป็นแบบไม่ cache ได้โดยไม่กระทบสัญญา (**ต้องยืนยันตอน implement**)

## 3. การค้นหาสองภาษา

- **Decision**: `OR` ของ `nameTh contains q` และ `nameEn contains q` แบบ `mode: 'insensitive'` ผ่าน Prisma
- **Rationale**: ข้อมูล 20 รายการ ไม่ต้องใช้ full-text search; ตรงกับ assumption ใน spec (จับคู่บางส่วน ไม่แยกตัวพิมพ์)
- **Alternatives**: `pg_trgm`/full-text — เกินความจำเป็น (constitution ข้อ VI)

## 4. การเก็บและตรวจค่าตัวกรองใน URL

- **Decision**: Zod schema เดียวใน `src/rules/catalog-query.ts` แปลง `searchParams` → `CatalogQuery`; ค่า enum ไม่ถูกต้องถูกทิ้งเป็นรายตัว (ไม่ throw) และมีค่าเริ่มต้น `sort=newest`; API ใช้ schema เดียวกัน แต่ตอบ `400 VALIDATION_ERROR` เมื่อ query ผิดตามสัญญา error ข้อ 13.3
- **Rationale**: spec FR-009 ให้หน้าเว็บ "ละเลยค่าที่ไม่ถูกต้อง" ส่วน API contract ใช้ error code มาตรฐาน — ใช้ schema เดียวกันแต่เลือกพฤติกรรมต่างกันตามผู้เรียก (`strict` flag)
- **Alternatives**: parse สองที่แยกกัน — เสี่ยงให้กฎไม่ตรงกัน

## 5. สลับภาษาแล้วอยู่หน้าเดิม

- **Decision**: ใช้ `createNavigation(routing)` ของ next-intl (`src/i18n/navigation.ts`) ให้ `LangSwitch` เป็น client component ที่ใช้ `Link` + `usePathname` + `useSearchParams` เพื่อรักษา path และ query; ภาษาเริ่มต้นและ cookie `NEXT_LOCALE` ให้ middleware ของ next-intl จัดการ (`src/proxy.ts` ใช้อยู่แล้ว ลำดับ cookie → Accept-Language → th ตรงกับ FR-017)
- **Rationale**: ของเดิมใน `page.tsx` ลิงก์ไป `/${other}` ซึ่งทิ้งหน้าปัจจุบัน ต้องแก้ตาม FR-018
- **Alternatives**: สร้าง URL เองด้วย string — พลาดง่ายกับ query และ locale prefix

## 6. hreflang และ `<html lang>`

- **Decision**: `<html lang>` มีอยู่แล้วใน layout; เพิ่ม `alternates.languages` ใน `generateMetadata` ของแต่ละหน้า (th/en ชี้หากัน)
- **Rationale**: FR-020; ใช้ Metadata API ของ Next ไม่ต้องเขียน tag เอง

## 7. รูปต้นไม้จำลอง

- **Decision (แก้หลังรีวิว UI)**: ใช้รูปถ่ายที่ AI สร้างในโปรเจกต์ Stitch ของร้าน (ชุดเดียวกับต้นแบบ UI) เก็บเป็น JPEG 800px ที่ `web/public/trees/<slug>-<n>.jpg` ดาวน์โหลดด้วย `web/scripts/fetch-tree-photos.mjs` แล้ว commit; แสดงผ่าน `next/image` (optimizer ปกติ)
- **Rationale**: รอบแรกใช้ SVG การ์ตูนแล้วหน้าเว็บไม่เหมือนต้นแบบและลูกค้าบอกว่าไม่สวย; รูป Stitch ไม่ติดลิขสิทธิ์ภายนอกและตรงกับ design (เลือกเฉพาะรูปที่ตรงชนิดต้นไม้)
- **Alternatives**: ดาวน์โหลดรูปถ่ายจริง — ติดลิขสิทธิ์และเพิ่มขนาด repo

## 8. ข้อมูลตัวอย่าง (seed)

- **Decision**: เขียน `seedCatalog(db)` เป็นฟังก์ชัน idempotent (upsert ตาม `slug`) ใน `src/seed/catalog.ts`; `prisma/seed.ts` เป็นแค่ตัวเรียก; รันตอนเริ่มคอนเทนเนอร์หลัง `prisma migrate deploy` (แก้ `CMD` ใน `web/Dockerfile`) ใช้ `slug` และ `id` ตายตัว
- **Rationale**: seed เป็นฟังก์ชัน idempotent จึงรันซ้ำได้ทุกครั้งที่คอนเทนเนอร์เริ่ม โดยข้อมูลตัวอย่างกลับเป็นค่าเดิมและ slug คงที่
- **ผลตอนทำจริง**: Node 24 รัน `.ts` ที่ import client ที่ generate ไว้ **ไม่ได้** (import ภายในไม่มีนามสกุลไฟล์) จึงเพิ่ม `tsx` เป็น devDependency, script `npm run seed` = `tsx prisma/seed.ts`, `Dockerfile` รัน seed หลัง `prisma migrate deploy`; ยืนยันแล้วว่ารันสองรอบได้ 21 แถวเท่าเดิม
- **Alternatives**: `prisma db seed` อย่างเดียว — เรียกจาก API ไม่ได้; **ต้องยืนยันตอน implement** ว่า Node 24 รัน `.ts` ที่ import client ที่ generate ไว้ได้โดยไม่ต้องเพิ่ม `tsx`

## 9. เครื่องมือทดสอบ

- **Decision**: เพิ่ม `vitest` และ `@playwright/test` เป็น devDependency; unit test อยู่ที่ `web/tests/unit`, e2e ที่ `web/tests/e2e` ต่อ `http://localhost:3000` ตามข้อ 13.1
- **Rationale**: constitution ข้อ V และ spec §8 กำหนดเครื่องมือนี้
- **หมายเหตุ**: บนเครื่องนี้พอร์ต 3000 ถูกคอนเทนเนอร์ `petshop` ใช้อยู่ ให้ตั้ง base URL ผ่านตัวแปรสภาพแวดล้อม (`BASE_URL`) ไม่ฮาร์ดโค้ด

## 10. ชุดคอมโพเนนต์ UI

- **Decision**: ใช้ daisyUI 5 (plugin ของ Tailwind 4 เป็น CSS ล้วน ไม่มี JS) ตามคำขอผู้ใช้ ตั้ง theme `treeshop` ใน `web/src/app/globals.css` จาก design tokens (Botanical Hearth) ปิด theme อื่นทั้งหมด; `--size-field: .3rem` ทำให้ `btn` สูง 48px ตามกฎ tap target
- **ใช้กับ**: `navbar`/`menu` (Header), `btn` (ปุ่มภาษา, ดูทั้งหมด), `card`/`badge` (TreeCard, ป้ายสินค้าหมด), `skeleton` (ระหว่างโหลด), `footer`; หน้ารายการ/รายละเอียดใช้ต่อ เช่น `input`, `select`, `checkbox`, `filter`, `breadcrumbs`, `carousel`
- **Rationale**: ได้คอมโพเนนต์ที่สม่ำเสมอโดยไม่เพิ่ม JS ใน bundle; สียังมาจาก token ชุดเดียวกับ design
