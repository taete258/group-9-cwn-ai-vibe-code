// เงินเก็บเป็นสตางค์ (int) แสดงเป็น ฿1,290.00 เหมือนกันทั้งสองภาษา (constitution ข้อ I)
const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// locale รับไว้ให้ผู้เรียกระบุภาษาตรง ๆ (ผลเหมือนกันทั้งสองภาษา) ถ้าวันหน้าแยกรูปแบบจะได้ไม่ต้องแก้ทุกจุดเรียก
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatBaht(satang: number, _locale: "th" | "en"): string {
  return `฿${fmt.format(satang / 100)}`;
}
