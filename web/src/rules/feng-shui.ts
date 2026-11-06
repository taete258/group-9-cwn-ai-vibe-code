// กฎฮวงจุ้ย (F4): แค่ตรวจตัวเลือกห้อง × เรื่องที่อยากเสริม ส่วนข้อมูลทิศ/เหตุผลมาจาก seed ของแต่ละต้น (ไม่มี AI)
export const ROOMS = ["LIVING", "BEDROOM", "OFFICE", "KITCHEN", "ENTRANCE", "BALCONY"] as const;
export const BENEFITS = ["WEALTH", "HEALTH", "LOVE", "CAREER"] as const;

type Input = Record<string, string | string[] | undefined>;
const pick = <T extends string>(list: readonly T[], v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return list.find((x) => x === s);
};

// ค่าผิด/ไม่มี → undefined เป็นรายตัว (หน้าเว็บถือว่ายังไม่เลือก, API ตอบ 400 เมื่อขาดตัวใดตัวหนึ่ง)
export const parseFengShuiQuery = (input: Input) => ({ room: pick(ROOMS, input.room), benefit: pick(BENEFITS, input.benefit) });
export type Room = (typeof ROOMS)[number];
export type Benefit = (typeof BENEFITS)[number];
