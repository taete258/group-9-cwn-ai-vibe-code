// spec 9: ทุกจุดที่ใช้เวลาปัจจุบันต้องเรียก now() ตัวนี้ เพื่อให้ /api/test/clock ควบคุมได้
let offsetMs = 0;

export function now(): Date {
  return new Date(Date.now() + offsetMs);
}

export function setNow(target: Date): void {
  if (process.env.TEST_MODE !== "1") throw new Error("setNow ใช้ได้เฉพาะ TEST_MODE=1");
  offsetMs = target.getTime() - Date.now();
}
