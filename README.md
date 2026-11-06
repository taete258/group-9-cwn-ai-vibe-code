# Tree Shop

ร้านต้นไม้ออนไลน์สำหรับ workshop: แคตตาล็อก (หน้าแรก รายการ รายละเอียด), ตะกร้าแบบ Guest ที่จบที่สรุปยอด (รวม VAT 7% และค่าส่ง), แนะนำตำแหน่งวางตามฮวงจุ้ย, สองภาษา (ไทย/อังกฤษ) · ไม่มี login/สั่งซื้อ/แอดมิน
สเปกอยู่ที่ [`spec.md`](spec.md) (v0.5) · แผนทดสอบ [`web/tests/TEST-PLAN.md`](web/tests/TEST-PLAN.md) · หลักการ [`.specify/memory/constitution.md`](.specify/memory/constitution.md)

## รัน

```bash
cp web/.env.example web/.env          # ครั้งแรก
docker compose up -d --build          # db (5435) + web (3000) · migrate + seed ให้เอง
```

พอร์ต 3000 ถูกโปรเจกต์อื่นใช้อยู่ → เปลี่ยน `ports` ของ `web` ใน `compose.yml` (เช่น `"3001:3000"`) แล้วตั้ง `BASE_URL` ตามด้านล่าง
ล้างข้อมูลกลับเป็นค่าตั้งต้น: `docker compose down -v && docker compose up -d --build`
พัฒนาแบบ hot reload: `docker compose up -d db && cd web && npm i && npx prisma migrate deploy && npm run seed && npm run dev`

## ทดสอบ (ทุกคำสั่งรันใน `web/`)

| ทำอะไร | คำสั่ง | ผลที่ได้ตอนนี้ |
|---|---|---|
| unit + property (fast-check 1,000 ตะกร้า/ข้อ) | `npm test` | 38 ผ่าน |
| e2e + แผนทดสอบ (TC-…) | `BASE_URL=http://localhost:3001 npx playwright test` | Chromium + WebKit ผ่านครบ 278/278 (รันซ้ำ 3 รอบผลเดิม) · Firefox ยังรันไม่ได้ในเครื่องที่ใช้ทดสอบ ดู TEST-PLAN หัวข้อ 10 |
| เบราว์เซอร์เดียว | `npx playwright test --project=chromium` (หรือ `firefox`, `webkit`) | |
| mutation testing ของ `src/rules/cart.ts` | `npm run mutation` | 100% (33/33) ดู [`MUTATION-REPORT.md`](MUTATION-REPORT.md) |
| lint / type-check | `npm run lint` · `npx tsc --noEmit` | ไม่มี error |

เบราว์เซอร์ครั้งแรก: `npx playwright install chromium firefox webkit`

## โครงสร้าง

```text
spec.md  compose.yml  README.md
specs/001-tree-shop/       user stories, requirements, diagrams (HTML)
specs/002-catalog-browsing feature แคตตาล็อก (spec/plan/tasks ตาม Spec Kit)
specs/003-cart-and-feng-shui  ตะกร้าและฮวงจุ้ย (บันทึกย้อนหลัง)
prompts/                   พรอมต์ของผู้ใช้ที่ใช้ระหว่างทำ
PROPERTY-REPORT.md  MUTATION-REPORT.md
web/                       Next.js 16 + Prisma 7 + PostgreSQL + next-intl + daisyUI
  src/rules/               กฎธุรกิจ (pure function): เงิน/VAT/ตะกร้า/ฮวงจุ้ย/query
  tests/unit  tests/property  tests/e2e  tests/e2e/plan  tests/TEST-PLAN.md
```

## ที่ยังไม่ได้ทำ
`/api/test/reset`, `/api/test/bug-mode` และ `BUG_MODE` ที่ฝังบั๊ก · การแลกบั๊กข้ามทีม · race test (ไม่มีการสั่งซื้อ/ตัด stock) · รายงาน e2e แบบ `index.html` + GIF · การวัด performance บน 4G
