# UI Design: แคตตาล็อกต้นไม้

ต้นแบบหน้าจอสร้างด้วย Stitch ใช้ design system "Botanical Hearth" (เขียวป่า #234E20, ครีม #FAF8F5, terracotta #D97746, ฟอนต์ Noto Sans Thai ทั้งหมด) แล้วแก้ให้ตรง [spec.md](../spec.md)

- โปรเจกต์ Stitch: https://stitch.withgoogle.com/projects/8043800307591235022
- ลูกค้าต้องการ: ดูสบายตา ข้อความอ่านง่าย รองรับมือถือและ desktop

## ไฟล์ภาพ

| หน้า | มือถือ 375px | Desktop 1280px | Stitch screen id |
|---|---|---|---|
| หน้าแรก | [home-mobile.jpg](home-mobile.jpg) | ดูใน Stitch (ไฟล์ภาพใหญ่เกินดาวน์โหลด) | มือถือ `6bad712bf27c4428acf790f58f623f57`, desktop `5f109c3af492472a8e9a1ae41cb1adb5` |
| รายการต้นไม้ | [list-mobile.jpg](list-mobile.jpg) | [list-desktop.jpg](list-desktop.jpg) | มือถือ `4fac453b1e304ac39a71fc0c9536ef59`, desktop `9051315c819b4a368296479a9022ae6a` |
| รายละเอียดต้นไม้ | [detail-mobile.jpg](detail-mobile.jpg) | [detail-desktop.jpg](detail-desktop.jpg) | มือถือ `8342debd0505400796e06fbf8594c938`, desktop `b8b2f500c5164e2992588676cddde1d0` |
| ไม่พบผลลัพธ์ / ไม่พบสินค้า | [empty-mobile.jpg](empty-mobile.jpg) | [empty-desktop.jpg](empty-desktop.jpg) | มือถือ `8a64f1a065fb40c689f817cd462db1bd`, desktop `208b7277607245b0a5838a9ea26e7fb9` |

## กฎการใช้ภาพเหล่านี้

ภาพเป็น **ต้นแบบเลย์เอาต์** ไม่ใช่ pixel-perfect และ spec.md ชนะเสมอเมื่อขัดกัน

- รูปต้นไม้ในภาพเป็นรูปที่ AI สร้าง (บางรูปไม่ตรงกับต้นไม้) ร้านใช้รูปจาก Stitch ชุดเดียวกันที่คัดให้ตรงชนิดแล้วใน `web/public/trees/*.jpg`
- ภาพ empty-mobile / empty-desktop แสดงสองสถานะต่อกันเพื่อดูแบบ จริงคือหน้าแยก: "ไม่พบผลลัพธ์" อยู่ในหน้ารายการ, "ไม่พบสินค้า" คือ not-found
- ห้ามเพิ่ม element ที่ไม่อยู่ใน spec แม้ภาพบางภาพจะมี: แถบเมนูด้านล่าง, ปุ่มแชร์, ชื่อวิทยาศาสตร์/ชื่ออังกฤษใต้ชื่อไทย **บนการ์ด** (หน้ารายละเอียดแสดงได้ตาม FR-012 หลังรีวิว), ป้ายระดับการดูแลบนการ์ด, ป้าย "มีสินค้า/รอสินค้าเข้า", แบนเนอร์การันตี, ลิงก์ footer (นโยบาย ติดต่อเรา), ช่องค้นหาบนหน้าแรก, ปุ่มตะกร้า/ซื้อ/login
- การ์ดต้นไม้ = รูป + ชื่อไทย + ราคา (฿1,290.00 รวม VAT) และป้าย "สินค้าหมด" เฉพาะ stock = 0 (รูปเป็นสีเทา)
- หน้าแรก: แถวหมวด (เสริมดวง ตกแต่ง ผักผลไม้) ตามด้วยแถวตามขนาด 3 แถว และตามสายพันธุ์ 5 แถว ทุกแถวเป็นการ์ดเลื่อนแนวนอนพร้อมลิงก์ "ดูทั้งหมด"
- Desktop: เนื้อหากว้างสูงสุด 1200px, หน้ารายการมี sidebar ตัวกรองซ้าย (280px) กับการ์ด 3 คอลัมน์, หน้ารายละเอียดสองคอลัมน์ (รูปซ้าย ข้อมูลขวา)

## Design tokens (เขียนเป็น Tailwind theme)

| token | ค่า |
|---|---|
| primary | `#234E20` |
| primary hover | `#2D5A27` |
| canvas | `#FAF8F5` |
| card | `#FFFFFF`, ขอบ `#E9E4DC`, มุม 16px |
| ข้อความหลัก | `#1D261C` (contrast ≥ 7:1) |
| ข้อความรอง | `#3F4A3D` (ห้ามอ่อนกว่า `#5A6657`) |
| ราคา | 20px ตัวหนา สีเขียว primary |
| เนื้อหา | 16px+, line-height 1.75; ปุ่มและ input สูง ≥ 48px |
| ฟอนต์ | Noto Sans Thai (next/font) ไม่ใช้ serif |
