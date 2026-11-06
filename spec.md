# Tree Shop — Spec (ฉบับร่าง v0.3)

> สถานะ: ร่างที่สาม ข้อที่เป็นสมมติฐานจะมีป้าย **[สมมติฐาน]** กำกับไว้ ดูสรุปที่ส่วน "คำถามที่ยังเปิดอยู่" ท้ายเอกสาร
>
> **เปลี่ยนจาก v0.1:** เพิ่มระบบสมาชิกและประวัติการสั่งซื้อ, คิด VAT 7% แบบรวมในราคา, เพิ่มคำแนะนำฮวงจุ้ย, เปลี่ยนหน้าแรกเป็นแนะนำสินค้าแยกตามหมวด, รวมแอดมินเข้ากับระบบสมาชิก (ใช้ role)
>
> **เปลี่ยนจาก v0.2:** เพิ่มข้อ 13 "สัญญาสำหรับการทดสอบ" โดยยกหลักการจาก `Teaching_CWN2026/00_week01/06_homework/01_coworking-testplan/API-CONTRACT.md` มาปรับให้เข้ากับร้านต้นไม้, เปลี่ยน DB เป็น PostgreSQL 16, กำหนดรูปแบบ error และเวลา, รองรับสองภาษา (ข้อ 9.1), รันทุก service ด้วย Docker Compose ไฟล์เดียว (ข้อ 8.1)

## 1. ภาพรวม

Tree Shop คือเว็บร้านขายต้นไม้ออนไลน์ขนาดเล็ก ใครก็เข้ามาดูต้นไม้และใส่ตะกร้าได้ แต่ต้องเป็นสมาชิกถึงจะสั่งซื้อและดูประวัติการสั่งซื้อได้ ระบบแนะนำต้นไม้ตามหมวด (เช่น เสริมดวง ตกแต่ง ผักผลไม้) และแนะนำตำแหน่งวางต้นไม้ในบ้านตามหลักฮวงจุ้ย เจ้าของร้านใช้หน้าแอดมินดูคำสั่งซื้อ อัปเดตสถานะ และจัดการสินค้า

**เป้าหมาย**

- ลูกค้าหาต้นไม้ที่ต้องการแล้วสั่งซื้อได้ภายใน 3 นาที
- ลูกค้าสามารถดูข้อมูล รายละเอียด และภาพเกี่ยวกับต้นไม้ได้ในหน้าจอเดียว
- ลูกค้าสามารถจัดการตะกร้าสินค้าด้วยตนเองได้
- ระบบมีการคำนวณค่าใช้จ่าย (include vat 7%) ให้ลูกค้าเห็นได้ก่อนสั่งซื้อ
- ลูกค้าสามารถกรอกที่อยู่ในการจัดส่งได้
- ลูกค้าสามารถดูประวัติการสั่งซื้อได้
- เจ้าของร้านรู้ทันทีเมื่อมีคำสั่งซื้อใหม่ และจัดการได้จากที่เดียว
- ระบบสามารถแนะนำตำแหน่งที่ตั้งต้นไม้ในบ้านเพื่อเสริมฮวงจุ้ยได้
- ระบบสามารถแนะนำสินค้าในหน้าแรก แยกตามหมวดหมู่ได้เช่น สายพันธุ์, เสริมดวง, ตกแต่ง, ผักผลไม้, ขนาด
- ระบบเล็กพอให้ทำเสร็จและ deploy ได้ภายใน workshop **[สมมติฐาน]**

**ไม่ใช่เป้าหมาย (รอบนี้)**

- marketplace ที่มีผู้ขายหลายราย
- แอปมือถือ (ใช้เว็บแบบ responsive แทน)

## 2. ผู้ใช้งาน

| บทบาท | คำอธิบาย | ต้อง login |
| --- | --- | --- |
| ผู้เยี่ยมชม (Guest) | ดูสินค้า ใช้คำแนะนำฮวงจุ้ย ใส่ตะกร้า | ไม่ต้อง |
| ลูกค้า (Member) | ทุกอย่างที่ Guest ทำได้ บวกสั่งซื้อ และดูประวัติกับสถานะคำสั่งซื้อ | ต้อง |
| แอดมิน (เจ้าของร้าน) | จัดการสินค้า หมวดหมู่ และคำสั่งซื้อ | ต้อง (บัญชีที่มี `role = ADMIN`) |

- Guest ใส่ตะกร้าได้เลย และระบบจะบังคับ login ตอนกด "สั่งซื้อ" เพื่อไม่ให้ลูกค้าหลุดก่อนตัดสินใจ **[สมมติฐาน]**

## 3. ฟีเจอร์

### 3.1 ฝั่งลูกค้า

**F1 — หน้าแรก: แนะนำสินค้าตามหมวด (`/`)**

- แบ่งเป็นแถว แถวละหนึ่งหมวด เลื่อนแนวนอนได้ และมีปุ่ม "ดูทั้งหมด" ไปที่หน้ารายการที่กรองหมวดนั้นไว้แล้ว
- หมวดเริ่มต้น:
  - **เสริมดวง** เช่น ต้นกวักมรกต ต้นเงินไหลมา ไผ่กวนอิม
  - **ตกแต่ง** เช่น มอนสเตอร่า ไทรใบสัก ลิ้นมังกร
  - **ผักผลไม้** เช่น มะนาว พริก กะเพรา มะเขือเทศ
  - **ตามขนาด:** เล็ก (ตั้งโต๊ะ) / กลาง (วางพื้น) / ใหญ่ (กลางแจ้ง)
  - **ตามสายพันธุ์:** ไม้ใบ / ไม้ดอก / ไม้อวบน้ำและแคคตัส / ไม้ผล / สมุนไพร
- แอดมินเลือกได้ว่าต้นไหนแสดงในหมวดไหน และเรียงลำดับอย่างไร (ข้อ A4)
- การ์ดสินค้าแสดงรูป ชื่อ ราคา (รวม VAT) และป้าย "สินค้าหมด" เมื่อ stock = 0

**F2 — หน้ารายการและค้นหา (`/trees`)**

- กรองตาม: หมวด, ขนาด, สายพันธุ์, ระดับการดูแล (ง่าย / ปานกลาง / ยาก), ปลอดภัยต่อสัตว์เลี้ยง
- ค้นหาจากชื่อ (ไทยและอังกฤษ)
- เรียงลำดับ: ใหม่ล่าสุด, ราคาต่ำ→สูง, ราคาสูง→ต่ำ
- ใส่ค่าที่กรองไว้ใน URL เช่น `/trees?collection=lucky&size=S` เพื่อให้แชร์ลิงก์ได้

**F3 — หน้ารายละเอียดต้นไม้ (`/trees/[slug]`)**

ข้อมูลทั้งหมดอยู่ในหน้าเดียว ไม่ต้องกดไปหน้าอื่น:

- แกลเลอรีรูป (ปัดดูบนมือถือได้ และกดขยายได้)
- ชื่อ ราคา (รวม VAT) จำนวนคงเหลือ
- คำอธิบาย
- ข้อมูลการดูแล: แสง น้ำ ความสูงโดยประมาณ ขนาดกระถาง ความยากในการดูแล เป็นพิษต่อสัตว์เลี้ยงหรือไม่
- **กล่องฮวงจุ้ย:** ตำแหน่งที่แนะนำ (ห้องและทิศ) และความหมายมงคล (ถ้าต้นนั้นมีข้อมูล)
- เลือกจำนวนแล้วกด "ใส่ตะกร้า" (จำนวนต้องไม่เกิน stock)
- "สินค้าที่เกี่ยวข้อง": ต้นอื่นในหมวดเดียวกัน 4 รายการ

**F4 — แนะนำตำแหน่งฮวงจุ้ย (`/feng-shui`)**

- ลูกค้าเลือกได้ 2 อย่าง:
  1. **ห้อง:** ห้องนั่งเล่น / ห้องนอน / ห้องทำงาน / ห้องครัว / ทางเข้าบ้าน / ระเบียง
  2. **เรื่องที่อยากเสริม:** การเงิน / สุขภาพ / ความรัก / การงาน
- ระบบแสดงต้นไม้ที่ตรงเงื่อนไข พร้อมคำแนะนำว่าควรวางทิศไหนและเพราะอะไร
- ใช้กฎที่กำหนดไว้ล่วงหน้า (rule-based) จากข้อมูลที่แอดมินกรอกให้แต่ละต้น ไม่ใช้ AI **[สมมติฐาน]**
- ใต้ผลลัพธ์มีข้อความว่า "คำแนะนำตามความเชื่อ เพื่อความสบายใจ"

**F5 — ตะกร้า (`/cart`)**

- Guest: เก็บตะกร้าใน `localStorage`
- Member: เก็บใน DB และพอ login แล้วจะรวมตะกร้าจาก `localStorage` เข้ากับของเดิม เพื่อให้เปิดจากเครื่องอื่นก็ยังเห็น
- เพิ่มหรือลดจำนวน และลบรายการได้ จำนวนต้องไม่เกิน stock
- ถ้าราคาหรือ stock เปลี่ยนตั้งแต่ใส่ตะกร้า ระบบจะเตือนลูกค้า
- แสดงสรุปค่าใช้จ่าย (ดูข้อ 4)

**F6 — ชำระเงินและสั่งซื้อ (`/checkout`)** ต้อง login

- **ที่อยู่จัดส่ง:** ชื่อผู้รับ, เบอร์โทร, บ้านเลขที่/ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์, หมายเหตุ
  - บันทึกได้หลายที่อยู่ และตั้งที่อยู่หลักได้ (ข้อ F8)
  - ฟอร์มจะเติมที่อยู่หลักให้อัตโนมัติ
- แสดงสรุปค่าใช้จ่ายแบบเต็ม (ข้อ 4) ก่อนกดยืนยัน
- วิธีชำระเงิน: โอนผ่าน PromptPay QR แล้วแนบสลิป **[สมมติฐาน]**
- server คำนวณราคา VAT ค่าส่ง และตรวจ stock ใหม่ทุกครั้ง ห้ามเชื่อตัวเลขที่ส่งมาจากฝั่ง client
- ตัด stock ทันทีที่สร้างคำสั่งซื้อ (ทำใน transaction เดียวกัน)
- สั่งซื้อสำเร็จแล้วแสดงเลขคำสั่งซื้อ เช่น `TS-20261106-0001` และล้างตะกร้า

**F7 — ประวัติการสั่งซื้อ (`/account/orders`)** ต้อง login

- รายการคำสั่งซื้อทั้งหมดของลูกค้า เรียงจากใหม่ไปเก่า: เลขคำสั่งซื้อ วันที่ ยอดสุทธิ สถานะ
- หน้ารายละเอียด (`/account/orders/[code]`): รายการสินค้า สรุปค่าใช้จ่าย ที่อยู่จัดส่ง สถานะปัจจุบันพร้อมเวลาที่เปลี่ยนแต่ละครั้ง และเลขพัสดุ
- ลูกค้ายกเลิกเองได้เมื่อสถานะยังเป็น `PENDING_PAYMENT`
- แนบสลิปภายหลังได้ ถ้าตอนสั่งยังไม่ได้แนบ
- ปุ่ม "สั่งซื้ออีกครั้ง" ใส่สินค้าชุดเดิมกลับเข้าตะกร้า

**F8 — บัญชีผู้ใช้ (`/account`)**

- สมัครสมาชิก / login ด้วยอีเมลและรหัสผ่าน **[สมมติฐาน]**
- ลืมรหัสผ่าน: ส่งลิงก์รีเซ็ตทางอีเมล
- แก้ชื่อและเบอร์โทร
- จัดการที่อยู่จัดส่ง: เพิ่ม แก้ ลบ และตั้งเป็นที่อยู่หลัก

### 3.2 ฝั่งแอดมิน (`/admin`)

**A1 — สิทธิ์การเข้าถึง**

- ใช้ระบบ login เดียวกับลูกค้า บัญชีที่มี `role = ADMIN` เท่านั้นที่เข้า `/admin` ได้
- สร้างบัญชีแอดมินคนแรกผ่าน seed script โดยอ่านค่าจาก env

**A2 — จัดการคำสั่งซื้อ**

- ตารางคำสั่งซื้อ เรียงจากใหม่ไปเก่า กรองตามสถานะได้ และค้นหาจากเลขคำสั่งซื้อหรือเบอร์โทรได้
- ดูรายละเอียดและสลิปการโอน
- เปลี่ยนสถานะตาม flow ในข้อ 6 และระบบบันทึกทุกครั้งว่าใครเปลี่ยนเมื่อไหร่
- ยกเลิกคำสั่งซื้อแล้วคืน stock อัตโนมัติ

**A3 — จัดการสินค้า**

- เพิ่ม แก้ไข และซ่อนสินค้า (ไม่ลบจริง เพื่อไม่ให้ประวัติคำสั่งซื้อพัง)
- อัปโหลดรูปหลายรูปและเรียงลำดับรูปได้
- แก้ราคา (รวม VAT) และ stock
- กรอกข้อมูลฮวงจุ้ย: ห้องที่เหมาะ, ทิศที่เหมาะ, เรื่องที่เสริม, คำอธิบายความหมาย

**A4 — จัดการหมวดหมู่หน้าแรก**

- เพิ่ม แก้ไข และซ่อนหมวด (เช่น เสริมดวง ตกแต่ง ผักผลไม้)
- เลือกสินค้าที่อยู่ในหมวดและเรียงลำดับการแสดงผล
- เรียงลำดับแถวบนหน้าแรก

**A5 — แจ้งเตือน**

- มีคำสั่งซื้อใหม่หรือลูกค้าแนบสลิปแล้ว ระบบส่งแจ้งเตือนเข้า LINE หรือ Email ของเจ้าของร้าน **[สมมติฐาน: เลือกอย่างใดอย่างหนึ่ง]**
- หน้า `/admin` แสดงจำนวนคำสั่งซื้อที่รอตรวจสลิป

## 4. การคำนวณค่าใช้จ่าย

ราคาสินค้าที่แสดงทุกที่ **รวม VAT 7% แล้ว** และค่าส่งก็รวม VAT แล้วเช่นกัน **[สมมติฐาน]**

```
ยอดรวมสินค้า (subtotal)  = Σ (ราคาต่อชิ้น × จำนวน)
ค่าส่ง (shippingFee)      = 0 ถ้า subtotal >= 1,000 บาท ไม่เช่นนั้น 60 บาท   [สมมติฐาน]
ยอดสุทธิ (total)          = subtotal + shippingFee
ภาษีมูลค่าเพิ่ม (vat)      = round(total × 7 / 107)
ราคาก่อน VAT (net)        = total − vat
```

ตัวอย่างที่ลูกค้าเห็นในตะกร้าและหน้า checkout:

| รายการ | จำนวนเงิน |
| --- | --- |
| ยอดรวมสินค้า | ฿890.00 |
| ค่าจัดส่ง | ฿60.00 |
| **ยอดสุทธิ (รวม VAT)** | **฿950.00** |
| ราคาก่อน VAT | ฿887.85 |
| VAT 7% | ฿62.15 |

- เก็บเงินทุกจำนวนเป็นหน่วย **สตางค์ (int)** และปัดเศษ VAT ครั้งเดียวที่ยอดสุทธิ ไม่ปัดทีละรายการ
- ใช้ฟังก์ชันคำนวณตัวเดียวกันทั้งฝั่ง client (แสดงผล) และ server (บันทึกจริง)
- ถ้ายอดยังไม่ถึงเกณฑ์ส่งฟรี ให้แสดงว่า "ซื้อเพิ่มอีก ฿110 เพื่อรับส่งฟรี"

## 5. Data Model

```
User
  id            string PK     // seed ใช้ id ตายตัว เช่น "M001", "ADMIN" เพื่อใช้กับ X-Test-User (ข้อ 13.1)
  email         string unique
  passwordHash  string
  name          string
  phone         string?
  locale        enum(th, en) default th   // ภาษาที่ใช้ส่งอีเมล
  role          enum(CUSTOMER, ADMIN) default CUSTOMER
  createdAt     datetime

Address
  id            int PK
  userId        FK -> User
  recipient     string
  phone         string
  line1         string        // บ้านเลขที่ ถนน
  subdistrict   string
  district      string
  province      string
  postcode      string(5)
  isDefault     bool

Tree
  id            int PK
  slug          string unique
  nameTh        string
  nameEn        string
  descriptionTh text
  descriptionEn text
  species       enum(FOLIAGE, FLOWERING, SUCCULENT, FRUIT, HERB)   // สายพันธุ์
  size          enum(S, M, L)
  careLevel     enum(EASY, MEDIUM, HARD)
  lightTh       string        // เช่น "แดดรำไร"
  lightEn       string        // เช่น "Partial shade"
  waterTh       string        // เช่น "สัปดาห์ละ 1 ครั้ง"
  waterEn       string        // เช่น "Once a week"
  heightCm      int?
  potSizeInch   int?
  petSafe       bool
  price         int           // สตางค์ รวม VAT แล้ว
  stock         int  CHECK (stock >= 0)
  images        string[]      // เรียงตามลำดับที่แสดง
  isActive      bool default true
  createdAt     datetime

FengShui                      // 1 ต้นมีได้หลายแถว
  id            int PK
  treeId        FK -> Tree
  room          enum(LIVING, BEDROOM, OFFICE, KITCHEN, ENTRANCE, BALCONY)
  direction     enum(N, NE, E, SE, S, SW, W, NW)
  benefit       enum(WEALTH, HEALTH, LOVE, CAREER)
  reasonTh      text          // เช่น "ทิศตะวันออกเฉียงใต้เป็นทิศแห่งทรัพย์"
  reasonEn      text

Collection                    // หมวดบนหน้าแรก เช่น เสริมดวง ตกแต่ง ผักผลไม้
  id            int PK
  slug          string unique
  nameTh        string
  nameEn        string
  sortOrder     int
  isActive      bool

CollectionItem
  collectionId  FK -> Collection
  treeId        FK -> Tree
  sortOrder     int
  PK(collectionId, treeId)

CartItem                      // ตะกร้าของ Member
  userId        FK -> User
  treeId        FK -> Tree
  quantity      int CHECK (quantity > 0)
  PK(userId, treeId)

Order
  id            int PK
  code          string unique // TS-YYYYMMDD-NNNN
  userId        FK -> User
  shippingAddress json        // copy จาก Address ณ ตอนสั่ง ถ้าลูกค้าแก้ที่อยู่ทีหลังก็ไม่กระทบ
  note          text?
  subtotal      int
  shippingFee   int
  vat           int
  total         int
  slipUrl       string?
  status        enum(PENDING_PAYMENT, PAID, SHIPPED, COMPLETED, CANCELLED)
  trackingNo    string?
  createdAt     datetime
  updatedAt     datetime

OrderItem
  id            int PK
  orderId       FK -> Order
  treeId        FK -> Tree
  nameThSnapshot string       // เก็บชื่อทั้งสองภาษาและราคา ณ ตอนสั่ง
  nameEnSnapshot string
  priceSnapshot int
  quantity      int CHECK (quantity > 0)

OrderStatusLog                // ใช้แสดง timeline ในประวัติการสั่งซื้อ
  id            int PK
  orderId       FK -> Order
  status        enum(...)
  changedBy     FK -> User
  createdAt     datetime
```

- ขนาด (`size`) และสายพันธุ์ (`species`) เป็น field ของ Tree โดยตรง เพราะต้นหนึ่งมีค่าเดียว ส่วนหมวดอย่างเสริมดวงหรือตกแต่งใช้ `Collection` เพราะต้นหนึ่งอยู่ได้หลายหมวด
- แถว "ตามขนาด" และ "ตามสายพันธุ์" บนหน้าแรกดึงจาก field พวกนี้ ไม่ต้องสร้าง Collection แยก
- ข้อความที่แอดมินกรอกเก็บเป็นคอลัมน์คู่ `xxxTh` / `xxxEn` เพราะรองรับแค่ 2 ภาษาตายตัว ถ้าในอนาคตต้องเพิ่มภาษาที่ 3 ค่อยย้ายไปใช้ตาราง translation
- ค่า enum (species, size, room, benefit, status) ไม่เก็บคำแปลใน DB แต่ไปแปลในไฟล์ข้อความของ UI

## 6. สถานะคำสั่งซื้อ

```
PENDING_PAYMENT ──(แอดมินตรวจสลิปแล้ว)──> PAID ──(ใส่เลขพัสดุ)──> SHIPPED ──> COMPLETED
       │                                    │
       └──────────────> CANCELLED <─────────┘   (คืน stock)
```

| การเปลี่ยนสถานะ | ใครทำได้ | เงื่อนไข |
| --- | --- | --- |
| → `PAID` | แอดมิน | ต้องมีสลิปแล้ว |
| → `SHIPPED` | แอดมิน | ต้องกรอก `trackingNo` |
| → `COMPLETED` | แอดมิน | — |
| → `CANCELLED` | ลูกค้า | เฉพาะตอน `PENDING_PAYMENT` |
| → `CANCELLED` | แอดมิน | ตอน `PENDING_PAYMENT` หรือ `PAID` |

- ยกเลิกอัตโนมัติถ้าไม่แนบสลิปภายใน 24 ชั่วโมง เพื่อคืน stock **[สมมติฐาน]**
- ทุกการเปลี่ยนสถานะเขียนลง `OrderStatusLog`

## 7. API (Route Handlers)

| Method | Path | ใครเรียก | หน้าที่ |
| --- | --- | --- | --- |
| POST | `/api/auth/*` | สาธารณะ | สมัคร, login, logout, ลืมรหัสผ่าน (ผ่าน Auth.js) |
| GET | `/api/home` | สาธารณะ | แถวหมวดบนหน้าแรกพร้อมสินค้า |
| GET | `/api/trees` | สาธารณะ | รายการสินค้า รองรับ `?collection=&size=&species=&care=&petSafe=&q=&sort=` |
| GET | `/api/trees/[slug]` | สาธารณะ | รายละเอียดสินค้า ข้อมูลฮวงจุ้ย และสินค้าที่เกี่ยวข้อง |
| GET | `/api/feng-shui?room=&benefit=` | สาธารณะ | ต้นไม้ที่แนะนำพร้อมทิศและเหตุผล |
| POST | `/api/cart/quote` | สาธารณะ | รับรายการในตะกร้า แล้วคืนสรุปค่าใช้จ่าย (ข้อ 4) และคำเตือนเรื่อง stock |
| GET/PUT | `/api/cart` | Member | อ่านหรือบันทึกตะกร้าใน DB |
| GET/POST/PATCH/DELETE | `/api/account/addresses[/id]` | Member | จัดการที่อยู่ |
| POST | `/api/orders` | Member | สร้างคำสั่งซื้อ |
| GET | `/api/account/orders[/code]` | Member | ประวัติการสั่งซื้อ (เห็นเฉพาะของตัวเอง) |
| POST | `/api/account/orders/[code]/slip` | Member | แนบสลิป |
| POST | `/api/account/orders/[code]/cancel` | Member | ยกเลิกคำสั่งซื้อ |
| GET/PATCH | `/api/admin/orders[/code]` | Admin | รายการคำสั่งซื้อ และเปลี่ยนสถานะ |
| POST/PATCH | `/api/admin/trees[/id]` | Admin | เพิ่มหรือแก้สินค้า รวมข้อมูลฮวงจุ้ย |
| POST/PATCH | `/api/admin/collections[/id]` | Admin | จัดการหมวดและสินค้าในหมวด |

> หน้าที่เป็น Server Component อ่าน DB ได้ตรงโดยไม่ต้องผ่าน API ส่วนตารางข้างบนคือ endpoint ที่ฝั่ง client ต้องเรียก

## 8. Tech Stack **[สมมติฐาน]**

| ส่วน | เลือกใช้ | เหตุผล |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | หน้าเว็บและ API อยู่ใน repo เดียว |
| UI | Tailwind CSS | เร็ว ไม่ต้องเขียน CSS แยก |
| i18n | `next-intl` | รองรับ App Router, middleware แยกภาษาจาก URL และจัดรูปแบบตัวเลข/วันที่ให้ |
| DB | PostgreSQL 16 + Prisma พอร์ตเครื่องเรา `5435` | ทดสอบการแข่งกันซื้อพร้อมกันได้จริง (ใช้พอร์ต 5435 เพื่อไม่ชนกับการบ้านที่ใช้ 5434) |
| Auth | NextAuth.js v5 (Auth.js, package `next-auth`) แบบ Credentials + bcrypt, JWT session | มี session และ middleware ให้แล้ว ทุกจุดต้องเรียก `getCurrentUser()` ตัวเดียว ซึ่งเช็ก `X-Test-User` ก่อนเมื่อ `TEST_MODE=1` แล้วค่อยเรียก `auth()` ของ NextAuth |
| กฎธุรกิจ | pure function ใน `src/rules/` (ราคา/VAT/ค่าส่ง, stock, flow สถานะ) ห้ามแตะ DB | ให้ property test และ Stryker เรียกกฎได้โดยไม่ต้องเปิด DB |
| QR PromptPay | `promptpay-qr` + `qrcode` | สร้าง QR ตามยอดเงิน |
| อีเมล (dev) | Mailpit ใน Docker | ทดสอบลิงก์รีเซ็ตรหัสผ่านและการแจ้งเตือนโดยไม่ส่งอีเมลจริง |
| ยกเลิกออเดอร์ค้าง | sweep ตอนมี request เกี่ยวกับออเดอร์ และหลัง `/api/test/clock` | ไม่ต้องมี cron และควบคุมด้วยนาฬิกาทดสอบได้ |
| Testing | Vitest (unit), fast-check (property), Playwright 3 เบราว์เซอร์ (e2e), Stryker เฉพาะ `src/rules/` (mutation) | ตรงกับเครื่องมือของวิชา |
| รูปและสลิป | เก็บที่ `uploads/` นอก `public` และให้สลิปเปิดผ่าน API ที่เช็กสิทธิ์ | สลิปมีข้อมูลบัญชีลูกค้า ห้ามเปิดเป็นไฟล์สาธารณะ |
| Validation | Zod | ใช้ schema ร่วมกันได้ทั้ง client และ server |
| รันทุก service | Docker Compose ไฟล์เดียว (ข้อ 8.1) | คำสั่งเดียวได้ครบทั้งเว็บ, DB และ Mailpit |

### 8.1 การรันด้วย Docker Compose

ใช้ `compose.yml` ไฟล์เดียวที่ root ของ repo ชื่อโปรเจกต์ `tree-shop`

| Service | Image / Build | พอร์ตเครื่องเรา | หน้าที่ |
| --- | --- | --- | --- |
| `db` | `postgres:16` | `5435` | ฐานข้อมูล เก็บข้อมูลใน volume `db-data` และมี healthcheck ด้วย `pg_isready` |
| `mailpit` | `axllent/mailpit` | `8025` (หน้าเว็บอ่านเมล), `1025` (SMTP) | รับอีเมลทั้งหมดตอน dev/test |
| `web` | build จาก `./web` | `3000` | Next.js รอให้ `db` healthy ก่อน แล้วรัน `prisma migrate deploy` ตามด้วย `next start` เก็บไฟล์อัปโหลดใน volume `uploads` |

```yaml
name: tree-shop
services:
  db:
    image: postgres:16
    environment: { POSTGRES_USER: tree, POSTGRES_PASSWORD: tree, POSTGRES_DB: tree }
    ports: ["5435:5432"]
    volumes: [db-data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tree"]
      interval: 2s
      retries: 30
  mailpit:
    image: axllent/mailpit
    ports: ["8025:8025", "1025:1025"]
  web:
    build: ./web
    env_file: ./web/.env
    environment:
      DATABASE_URL: postgresql://tree:tree@db:5432/tree
      SMTP_URL: smtp://mailpit:1025
    ports: ["3000:3000"]
    volumes: [uploads:/app/uploads]
    depends_on:
      db: { condition: service_healthy }
      mailpit: { condition: service_started }
volumes:
  db-data:
  uploads:
```

**คำสั่งที่ใช้บ่อย**

| ทำอะไร | คำสั่ง |
| --- | --- |
| เปิดทุก service | `docker compose up -d --build` |
| rebuild แค่เว็บ (ข้อมูลใน DB ไม่หาย) | `docker compose up -d --build web` |
| สลับโหมดบั๊ก | แก้ `BUG_MODE` ใน `web/.env` แล้วรัน `docker compose up -d web` |
| ดู log เว็บ | `docker compose logs -f web` |
| ปิดทั้งหมด (เก็บข้อมูลไว้) | `docker compose down` |
| ปิดและล้างข้อมูลทั้งหมด | `docker compose down -v` |

- ค่าใน `web/.env` (copy จาก `web/.env.example`) ใช้ไฟล์เดียวทั้ง `npm run dev` และ compose โดย compose จะทับ `DATABASE_URL` กับ `SMTP_URL` ให้ชี้ไปที่ service ใน network: `TEST_MODE`, `BUG_MODE`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `web/.env` ห้าม commit
- ตอนพัฒนาจะรันแค่ `docker compose up -d db mailpit` แล้วใช้ `npm run dev` บนเครื่องก็ได้ (ต่อ DB ที่ `localhost:5435`)

## 9. Non-functional

- **Responsive:** ใช้บนมือถือเป็นหลัก ทดสอบที่ความกว้าง 375px
- **ภาษา:** รองรับไทยและอังกฤษ (รายละเอียดในข้อ 9.1)
- **เวลา:** ใน API ใช้ ISO 8601 พร้อม offset `+07:00` เสมอ เช่น `2026-11-18T17:00:00+07:00` และทุกจุดที่ใช้เวลาปัจจุบันต้องเรียกผ่านฟังก์ชัน `now()` ตัวเดียว เพื่อให้ `/api/test/clock` ควบคุมได้
- **ความปลอดภัย:**
  - validate input ทุกตัวที่ server
  - hash รหัสผ่านด้วย bcrypt และกำหนดรหัสผ่านอย่างน้อย 8 ตัวอักษร
  - ลูกค้าเห็นเฉพาะคำสั่งซื้อ ที่อยู่ และสลิปของตัวเอง โดยเช็ก `userId` ทุก query
  - ทุก route ใต้ `/api/admin/*` และ `/admin/*` ต้องเช็ก `role = ADMIN`
  - จำกัดไฟล์สลิป: เฉพาะ jpg/png/webp ขนาดไม่เกิน 5MB และตั้งชื่อไฟล์ใหม่แบบสุ่ม
  - rate limit ที่ login, สมัครสมาชิก, ลืมรหัสผ่าน และ `POST /api/orders`
- **ความถูกต้องของ stock:** ตัด stock ด้วย `UPDATE ... WHERE stock >= qty` ใน transaction เพื่อกันขายเกิน
- **ความถูกต้องของเงิน:** คำนวณเป็นสตางค์ทั้งหมด และมี unit test ของฟังก์ชันคำนวณในข้อ 4
- **Performance:** หน้าแรกและหน้ารายการโหลดเสร็จภายใน 2 วินาทีบน 4G และย่อรูปผ่าน `next/image`

### 9.1 สองภาษา (ไทย / อังกฤษ)

- **URL:** มี prefix ภาษาทุกหน้า เช่น `/th/trees/monstera` และ `/en/trees/monstera` โดยใช้ slug เดียวกันทั้งสองภาษา
- **ภาษาเริ่มต้น:** เข้า `/` แล้วเลือกภาษาตามลำดับนี้: cookie `NEXT_LOCALE` → header `Accept-Language` → ไทย
- **สลับภาษา:** ปุ่มที่ header ทุกหน้า สลับแล้วอยู่หน้าเดิม ตะกร้าไม่หาย และจำค่าไว้ใน cookie
- **ข้อความ UI:** เก็บในไฟล์ `messages/th.json` และ `messages/en.json` ห้ามเขียนข้อความลงในโค้ดตรง ๆ
- **ข้อมูลสินค้า:** แอดมินต้องกรอกทั้งสองภาษา (ฟอร์มมีแท็บ ไทย | English) ทุกช่องบังคับกรอก บันทึกไม่ได้ถ้าภาษาใดภาษาหนึ่งว่าง
- **รูปแบบตัวเลขและวันที่:** ใช้ `Intl` ตามภาษา
  - ราคาแสดงเป็น `฿1,290.00` ทั้งสองภาษา
  - วันที่ภาษาไทยใช้ พ.ศ. (`18 พ.ย. 2569`) และภาษาอังกฤษใช้ ค.ศ. (`18 Nov 2026`)
  - ใน API ยังเป็น ISO และสตางค์เสมอ ไม่ขึ้นกับภาษา
- **ค้นหา:** ค้นจากชื่อทั้งสองภาษาพร้อมกัน ไม่ว่าจะอยู่หน้าภาษาไหน
- **API:** endpoint สาธารณะรับ `?locale=th|en` (ค่าเริ่มต้น `th`) และคืนข้อความเฉพาะภาษานั้น ส่วน `/api/admin/*` คืนครบทั้งสองภาษา
- **อีเมล:** ส่งตาม `User.locale` ซึ่งตั้งค่าตามภาษาตอนสมัคร และแก้ได้ในหน้าบัญชี
- **SEO:** ใส่ `<html lang>` ให้ตรงภาษา และใส่ `hreflang` ชี้หากันระหว่างสองภาษา
- **ไม่แปล:** เลขคำสั่งซื้อ, slug, ที่อยู่ที่ลูกค้ากรอก, error code

## 10. นอกขอบเขต (รอบนี้)

- login ผ่าน social (Google, LINE) **[ทำทีหลังได้]**
- payment gateway ตัดบัตรอัตโนมัติ
- ออกใบกำกับภาษีเต็มรูป
- คูปอง ส่วนลด และโปรโมชัน
- รีวิวและให้คะแนน
- คำนวณค่าส่งตามน้ำหนักหรือพื้นที่
- คำแนะนำฮวงจุ้ยแบบคำนวณจากวันเกิดหรือทิศบ้านจริง หรือใช้ AI
- ภาษาที่ 3 ขึ้นไป และการแปลอัตโนมัติ
- แอดมินหลายระดับสิทธิ์

## 11. ลำดับการทำ (Milestones)

1. **M1 — แคตตาล็อก:** โครงโปรเจกต์, schema, seed ต้นไม้ 20 รายการพร้อมหมวดและข้อมูลฮวงจุ้ย, หน้าแรกแบบแบ่งหมวด, หน้ารายการ/ค้นหา, หน้ารายละเอียด
2. **M2 — ตะกร้าและค่าใช้จ่าย:** ตะกร้า `localStorage`, ฟังก์ชันคำนวณ VAT และค่าส่งพร้อม unit test, `/api/cart/quote`
3. **M3 — สมาชิกและสั่งซื้อ:** สมัคร/login, ที่อยู่, รวมตะกร้า, checkout, ตัด stock, แนบสลิป
4. **M4 — ประวัติและแอดมิน:** ประวัติการสั่งซื้อพร้อม timeline, หน้าแอดมินจัดการคำสั่งซื้อและสถานะ, แจ้งเตือน
5. **M5 — ฮวงจุ้ยและหลังบ้าน:** หน้า `/feng-shui`, แอดมินจัดการสินค้าและหมวด
6. **M6 — ปิดงาน:** responsive polish, ยกเลิกออเดอร์ค้างอัตโนมัติ, deploy

## 12. Acceptance Criteria หลัก

**ลูกค้า**

- [ ] Guest ใส่ตะกร้าได้ พอกดสั่งซื้อระบบพาไป login แล้วกลับมาที่ checkout โดยตะกร้ายังอยู่ครบ
- [ ] ยอดสุทธิ VAT และราคาก่อน VAT ในตะกร้า หน้า checkout และใน DB ตรงกันทุกสตางค์
- [ ] ตะกร้า 890 บาทคิดค่าส่ง 60 บาท และตะกร้า 1,000 บาทส่งฟรี
- [ ] หน้ารายละเอียดแสดงรูป ข้อมูลการดูแล และฮวงจุ้ยครบในหน้าเดียว
- [ ] หน้า `/feng-shui` เลือก "ห้องนั่งเล่น + การเงิน" แล้วได้รายการต้นไม้พร้อมทิศและเหตุผล
- [ ] หน้าแรกแสดงแถวหมวดตามลำดับที่แอดมินตั้งไว้
- [ ] ลูกค้าเห็นประวัติการสั่งซื้อของตัวเองพร้อม timeline สถานะ
- [ ] กดสลับภาษาที่หน้ารายละเอียดต้นไม้แล้วยังอยู่หน้าเดิม เนื้อหาเปลี่ยนภาษาครบ และตะกร้าไม่หาย
- [ ] ไม่มีข้อความภาษาไทยหลงอยู่ในหน้า `/en` (ยกเว้นข้อมูลที่ลูกค้ากรอกเอง)
- [ ] ยอดเงินใน quote เท่ากันทุกสตางค์ทั้ง `locale=th` และ `locale=en`

**ความปลอดภัยและความถูกต้อง**

- [ ] สั่งเกิน stock ไม่ได้ ทั้งจาก UI และการยิง API ตรง (API ตอบ `409 OUT_OF_STOCK`)
- [ ] ลูกค้า 50 คนกดซื้อต้นไม้ที่เหลือชิ้นสุดท้ายพร้อมกัน ต้องสำเร็จแค่ 1 คน และ stock ไม่ติดลบ
- [ ] ตั้งเวลาด้วย `/api/test/clock` ไปข้างหน้า 24 ชั่วโมง แล้วคำสั่งซื้อที่ไม่แนบสลิปถูกยกเลิกและคืน stock
- [ ] แก้ราคาใน request ที่ฝั่ง client แล้วยอดใน DB ไม่เปลี่ยน
- [ ] ลูกค้า A เปิดคำสั่งซื้อหรือสลิปของลูกค้า B ไม่ได้ (ได้ 404)
- [ ] Member ที่ไม่ใช่แอดมินเรียก `/api/admin/*` แล้วได้ 403
- [ ] ยกเลิกคำสั่งซื้อ (ทั้งแบบกดเองและแบบอัตโนมัติ) แล้ว stock กลับมาครบ

**แอดมิน**

- [ ] แอดมินได้รับแจ้งเตือนภายใน 1 นาทีหลังมีคำสั่งซื้อใหม่หรือมีสลิปเข้า
- [ ] เปลี่ยนเป็น `SHIPPED` โดยไม่ใส่เลขพัสดุไม่ได้

## 13. สัญญาสำหรับการทดสอบ

ทุกข้อในส่วนนี้คือสัญญาที่ test plan, property test และ Playwright ใช้อ้างอิง เพิ่ม endpoint อื่นได้ แต่ห้ามเปลี่ยนชื่อ รูปแบบ หรือความหมายของที่อยู่ในส่วนนี้

### 13.1 พื้นฐาน

| เรื่อง | ค่า |
| --- | --- |
| เว็บ | `http://localhost:3000` (service `web` ใน `compose.yml`) |
| ฐานข้อมูล | PostgreSQL 16 (service `db`) พอร์ตเครื่องเรา `5435` |
| อีเมล | Mailpit (service `mailpit`) อ่านเมลผ่าน API `http://localhost:8025/api/v1/messages` |
| เปิดระบบ | `docker compose up -d --build` แล้วเรียก `POST /api/test/reset` |
| เวลา | ISO 8601 พร้อม `+07:00` เสมอ |
| เงิน | หน่วย **สตางค์ (integer)** ใน API ทุกจุด หน้าเว็บแสดงเป็นบาท |
| ผู้ใช้ | เมื่อ `TEST_MODE=1` ส่ง header `X-Test-User: <user_id>` แทนการ login จริงได้ ถ้าไม่ส่งถือว่าเป็น Guest และ `X-Test-User: ADMIN` คือแอดมิน |
| error | HTTP 4xx + `{ "error": "<CODE>", "message": "<ข้อความ>" }` โดย CODE เป็นตัวพิมพ์ใหญ่คั่นด้วย `_` และ `message` เป็นภาษาตาม `?locale=` (ค่าเริ่มต้นไทย) **test ต้องเทียบแค่ `error` ห้ามเทียบ `message`** |
| ภาษา | หน้าเว็บอยู่ใต้ `/th/...` และ `/en/...` ส่วน test ที่ไม่ได้ทดสอบเรื่องภาษาใช้ `/th` |

- `X-Test-User` ต้องใช้ไม่ได้เลยเมื่อ `TEST_MODE` ไม่ใช่ `1` (ถ้าหลุดไป production จะกลายเป็นช่องให้สวมรอยเป็นใครก็ได้)

### 13.2 Endpoint สำหรับทดสอบ (มีเฉพาะเมื่อ `TEST_MODE=1`)

| Method | Path | ทำอะไร | ตอบ |
| --- | --- | --- | --- |
| POST | `/api/test/reset` | ล้างข้อมูลทั้งหมดแล้ว seed ใหม่ตาม `TEST-DATA.md` และตั้งเวลาระบบกลับเป็น พุธ 18 พ.ย. 2026 10:00 | `{ "ok": true }` |
| POST | `/api/test/clock` | ตั้งเวลาระบบ body `{ "now": "<ISO>" }` แล้วรันการยกเลิกออเดอร์ค้างทันที | `{ "ok": true, "now": "<ISO>" }` |
| GET | `/api/test/bug-mode` | ดูโหมดบั๊กปัจจุบัน | `{ "bugMode": 0 \| 1 \| 2 }` |

- `TEST-DATA.md` ต้องกำหนด user (`ADMIN`, `M001`, `M002`), ต้นไม้ที่มี stock หลายแบบ (รวมต้นที่เหลือ 1 ชิ้นและต้นที่หมด), หมวด และข้อมูลฮวงจุ้ย ด้วย id และ slug ตายตัว

### 13.3 Endpoint หลักที่ test ใช้

รายการเต็มอยู่ในข้อ 7 ส่วนนี้กำหนดรูปแบบ request/response ที่ test พึ่งพา:

| Method | Path | Body / Query | ตอบ (สำเร็จ) |
| --- | --- | --- | --- |
| GET | `/api/trees` | query ตามข้อ 7 | `[{ "id", "slug", "name", "price", "stock", "size", "species" }]` |
| GET | `/api/me` | ต้องมี user | `{ "id", "name", "email", "role": "CUSTOMER" \| "ADMIN" }` |
| POST | `/api/cart/quote` | `{ "items": [{ "treeId", "quantity" }] }` | ดูข้อ 13.4 และ **ไม่บันทึกอะไร** |
| POST | `/api/orders` | `{ "items": [...], "addressId", "note"? }` | `201` + `{ "code": "TS-<YYYYMMDD>-<NNNN>", "status": "PENDING_PAYMENT", "quote": { ...ข้อ 13.4 } }` |
| GET | `/api/account/orders/:code` | — | `{ "code", "status", "quote", "items", "shippingAddress", "trackingNo", "statusLog": [{ "status", "at" }] }` |
| POST | `/api/account/orders/:code/cancel` | — | `{ "status": "CANCELLED" }` |
| PATCH | `/api/admin/orders/:code` | `{ "status", "trackingNo"? }` | `{ "status" }` |

**Error code ที่กำหนดไว้**

| HTTP | CODE | เมื่อไหร่ |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | input ไม่ผ่าน schema |
| 401 | `UNAUTHENTICATED` | ต้อง login แต่ไม่ได้ login |
| 403 | `FORBIDDEN` | login แล้วแต่ไม่มีสิทธิ์ เช่น ลูกค้าเรียก `/api/admin/*` |
| 404 | `NOT_FOUND` | ไม่พบ หรือเป็นของคนอื่น (ตอบ 404 เพื่อไม่บอกว่ามีอยู่จริง) |
| 409 | `OUT_OF_STOCK` | stock ไม่พอตอนสร้างคำสั่งซื้อ |
| 409 | `INVALID_STATUS_TRANSITION` | เปลี่ยนสถานะผิด flow ในข้อ 6 |
| 422 | `TRACKING_REQUIRED` | เปลี่ยนเป็น `SHIPPED` โดยไม่ใส่เลขพัสดุ |
| 429 | `RATE_LIMITED` | เรียกถี่เกิน |

### 13.4 รูปแบบใบเสนอราคา (quote) ที่ property test ใช้เทียบ

```json
{
  "lines": [
    { "treeId": 3, "slug": "monstera", "unitPrice": 45000, "quantity": 1, "amount": 45000 },
    { "treeId": 7, "slug": "money-plant", "unitPrice": 22250, "quantity": 2, "amount": 44500 }
  ],
  "subtotal": 89500,
  "shippingFee": 6000,
  "total": 95500,
  "vat": 6248,
  "net": 89252,
  "freeShippingRemaining": 10500,
  "warnings": [
    { "treeId": 7, "code": "INSUFFICIENT_STOCK", "available": 1 }
  ]
}
```

กติกาของรูปแบบนี้:

- `amount` = `unitPrice × quantity` และ `subtotal` = ผลรวม `lines[].amount`
- `total` = `subtotal + shippingFee`
- `vat` = `total × 7 / 107` ปัดครึ่งขึ้น (half-up) เป็นสตางค์ และ `net` = `total − vat` **[ตัดสินเอง: ร้านยังไม่ได้ยืนยันวิธีปัด]**
- `freeShippingRemaining` = `max(0, 100000 − subtotal)`
- `warnings[].code` มีได้แค่ `OUT_OF_STOCK`, `INSUFFICIENT_STOCK`, `PRICE_CHANGED`
- ใช้ฟังก์ชันคำนวณตัวเดียวกันทั้ง `/api/cart/quote`, `/api/orders` และหน้าจอ ส่วน oracle ของ test ต้องเขียนแยกเองจากข้อ 4 ห้ามเรียกฟังก์ชันของเว็บ

### 13.5 `data-testid` ขั้นต่ำ

| testid | อยู่ที่ |
| --- | --- |
| `collection-row-<slug>` | แถวหมวดบนหน้าแรก |
| `tree-card-<slug>` | การ์ดต้นไม้ |
| `search-input`, `filter-size`, `filter-species`, `filter-collection` | ค้นหาและตัวกรอง |
| `tree-price`, `tree-stock`, `feng-shui-box` | หน้ารายละเอียด |
| `quantity-input`, `add-to-cart` | เลือกจำนวน + ปุ่มใส่ตะกร้า |
| `cart-line`, `cart-subtotal`, `cart-shipping`, `cart-total`, `cart-vat`, `cart-net`, `free-shipping-remaining` | สรุปค่าใช้จ่ายในตะกร้าและหน้า checkout |
| `cart-warning` | คำเตือน stock หรือราคาเปลี่ยน |
| `fengshui-room`, `fengshui-benefit`, `fengshui-result` | หน้า `/feng-shui` |
| `address-select`, `checkout-confirm` | หน้า checkout |
| `order-code`, `order-status` | หน้าหลังสั่งซื้อสำเร็จและหน้ารายละเอียดคำสั่งซื้อ |
| `order-row-<code>`, `cancel-order`, `upload-slip` | ประวัติการสั่งซื้อ |
| `admin-order-status`, `admin-tracking-input`, `admin-save-status` | หน้าแอดมิน |
| `lang-switch` | ปุ่มสลับภาษาที่ header |
| `error-message` | ข้อความ error ทุกจุด |
| `<body data-bug-mode="0\|1\|2">` | บอกโหมดบั๊กปัจจุบัน |

### 13.6 โหมดบั๊ก

| ค่า | ใครฝัง | เฉลยอยู่ที่ |
| --- | --- | --- |
| `BUG_MODE=0` | — (เว็บปกติ) | — |
| `BUG_MODE=1` | Claude ตอนสร้างเว็บ เลือกเอง 3 ตัว (เช่น ปัด VAT ผิด, ไม่คืน stock ตอนยกเลิก, เกณฑ์ส่งฟรีใช้ `>` แทน `>=`) | `web/BUGS.md` (ห้ามเปิดจนกว่าจะทดสอบเสร็จ) |
| `BUG_MODE=2` | ทีมคู่ที่แลกเว็บกันทดสอบ | ไฟล์เข้ารหัสที่ส่งผู้สอน |

## 14. คำถามที่ยังเปิดอยู่

1. project นี้เป็น demo สำหรับ workshop หรือจะใช้ขายจริง (กระทบเรื่อง payment, deploy, security และใบกำกับภาษี)
2. login ด้วยอีเมลและรหัสผ่านพอไหม หรืออยากได้ LINE Login (คนไทยใช้เยอะกว่า แต่ต้องตั้ง LINE Developers channel)
3. Guest ควรใส่ตะกร้าได้ก่อน login หรือบังคับ login ตั้งแต่แรก
4. ค่าส่งรวม VAT ด้วยไหม และกติกาค่าส่ง 60 บาท ส่งฟรีเมื่อครบ 1,000 บาท ใช้ได้ไหม
5. ลูกค้าต้องการใบกำกับภาษีหรือใบเสร็จไหม
6. คำแนะนำฮวงจุ้ยแบบเลือกห้องและเรื่องที่อยากเสริม (rule-based) พอไหม หรือต้องการแบบละเอียดกว่านี้
7. หมวดบนหน้าแรกมีแค่ 5 หมวดในเป้าหมาย หรือแอดมินต้องเพิ่มหมวดเองได้ (spec ตอนนี้ให้เพิ่มได้)
8. แจ้งเตือนผ่าน LINE หรือ Email
9. ยกเลิกออเดอร์ที่ไม่แนบสลิปภายใน 24 ชั่วโมงได้ไหม
