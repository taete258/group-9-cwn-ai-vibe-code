# Quickstart: ตรวจว่าแคตตาล็อกทำงาน

## เตรียม

```bash
cd web && cp -n .env.example .env
docker compose up -d db          # รันที่ root ของ repo
npm ci
npx prisma migrate deploy
npm run seed                             # idempotent รันซ้ำได้
npm run dev                              # http://localhost:3000 (ถ้าพอร์ตชน ใช้ PORT=3001)
```

หรือรันทั้งชุด: `docker compose up -d --build` (ถ้า 3000 ถูกใช้ ให้ override พอร์ตของ `web`)

**ตรวจ seed idempotent**: รัน `npm run seed` สองรอบ แล้ว `docker compose exec db psql -U tree -c 'SELECT count(*) FROM "Tree"'` ต้องได้ 21 ทั้งสองครั้ง

## ตรวจด้วยมือ (ตรงกับ Acceptance Scenarios)

| # | ทำ | ผลที่ต้องเห็น |
|---|---|---|
| 1 | เปิด `/` | redirect ไป `/th` เห็นแถวหมวด เสริมดวง · ตกแต่ง · ผักผลไม้ + แถวขนาด/สายพันธุ์ ตามลำดับ (US1) |
| 2 | เลื่อนแถว, กด "ดูทั้งหมด" | ไป `/th/trees?collection=…` ที่กรองแล้ว |
| 3 | หาการ์ดต้นที่ stock = 0 | มีป้าย "สินค้าหมด" (US1.3) |
| 4 | `/th/trees` → กรองหลายตัว + ค้นหา "monstera" แล้ว "มอนสเตอร่า" | ได้ต้นเดียวกัน (US3.2); คัดลอก URL เปิดแท็บใหม่ได้ผลเดียวกัน (US3.4) |
| 5 | `/th/trees?size=XL&sort=bad` | ไม่ error ใช้ค่าเริ่มต้น (FR-009) |
| 6 | เปิดต้นที่มีฮวงจุ้ย | เห็นแกลเลอรี ข้อมูลการดูแล กล่องฮวงจุ้ย + disclaimer สินค้าที่เกี่ยวข้อง 4 ต้น (US2) |
| 7 | เปิดต้นที่ไม่มีฮวงจุ้ย | ไม่มีกล่องฮวงจุ้ย |
| 8 | เปิด `/th/trees/ไม่มีอยู่` และต้นที่ซ่อน | หน้า "ไม่พบสินค้า" (`error-message`) |
| 9 | อยู่หน้ารายละเอียด กด `lang-switch` | ไป `/en/trees/<slug>` ต้นเดิม ไม่มีข้อความไทยหลงในหน้า (US4) |
| 10 | ลองที่ความกว้าง 375px | ไม่เลื่อนแนวนอนทั้งหน้า (SC-003) |

## ตรวจ API

```bash
B=http://localhost:3000
curl -s "$B/api/trees?locale=en&size=M&sort=price_asc" | head -c 400
curl -s "$B/api/trees/<slug>?locale=th"
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/trees/no-such"        # 404
curl -s -w "\n%{http_code}\n" "$B/api/trees?size=XL"                   # 400 {"error":"VALIDATION_ERROR",…}
curl -s "$B/api/home" | head -c 400
```

## ชุดทดสอบอัตโนมัติ

```bash
cd web
npx vitest run                           # unit: rules/*, key ของ messages ตรงกัน
BASE_URL=http://localhost:3000 npx playwright test   # e2e ต่อ stack ที่รันอยู่
```

ผ่านเมื่อ: ทุกแถวด้านบนตรงกับผลที่คาด, unit + e2e เขียวทั้งหมด, `/api/trees` ไม่มีต้นที่ซ่อน
