import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

type Row = { room: string; direction: string; benefit: string; reason: string };

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d={d} /></svg>
);

// ไอคอนห้อง
const ROOM_ICON: Record<string, string> = {
  LIVING: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2",
  BEDROOM: "M2 18V8M2 14h20M22 18v-6a3 3 0 0 0-3-3h-9v5M6 11.5h.01",
  OFFICE: "M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18",
  KITCHEN: "M6 14a4 4 0 1 1 1-7.9A5 5 0 0 1 17 6.100 4 4 0 1 1 18 14M6 14v6h12v-6M6 17h12",
  ENTRANCE: "M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01",
  BALCONY: "M3 12h18M5 12v8M9 12v8M15 12v8M19 12v8M3 20h18M12 3v3M5.600 6.600l2 2M18.400 6.600l-2 2",
};

// เรื่องที่เสริม: ไอคอน + สีของแต่ละเรื่อง (class เขียนเต็มเพื่อให้ Tailwind เห็น)
const BENEFIT: Record<string, { d: string; tint: string }> = {
  WEALTH: { d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.500 9.500a2.500 2 0 0 0-2.500-1.500c-1.400 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1.100 2-2.500 2a2.500 2 0 0 1-2.500-1.500M12 6v2M12 16v2", tint: "bg-warning/15 text-warning" },
  HEALTH: { d: "M8 3h8v5h5v8h-5v5H8v-5H3V8h5z", tint: "bg-success/15 text-success" },
  LOVE: { d: "M12 21s-8-5-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 6-8 11-8 11z", tint: "bg-secondary/20 text-secondary" },
  CAREER: { d: "M3 17l6-6 4 4 8-8M15 7h6v6", tint: "bg-info/15 text-info" },
};

// เข็มทิศ 8 ทิศ: ไฮไลต์ทิศมงคล (0° = เหนือ หมุนตามเข็มนาฬิกา)
const ANGLE: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(60 + r * Math.sin(a)).toFixed(2)} ${(60 - r * Math.cos(a)).toFixed(2)}`;
};
const wedge = (deg: number) =>
  `M${pt(22, deg - 21)} L${pt(50, deg - 21)} A50 50 0 0 1 ${pt(50, deg + 21)} L${pt(22, deg + 21)} A22 22 0 0 0 ${pt(22, deg - 21)}Z`;

function Compass({ direction, label }: { direction: string; label: string }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 120 120" className="h-32 w-32 shrink-0 drop-shadow-sm">
      <circle cx="60" cy="60" r="57" className="fill-base-100 stroke-base-300" strokeWidth="2" />
      {Object.entries(ANGLE).map(([k, deg]) => (
        <path key={k} d={wedge(deg)} className={k === direction ? "fill-primary" : "fill-base-200"} />
      ))}
      <circle cx="60" cy="60" r="8" className="fill-base-100 stroke-base-300" strokeWidth="2" />
      <circle cx="60" cy="60" r="3" className="fill-accent" />
      {(["N", "E", "S", "W"] as const).map((k) => {
        const [x, y] = pt(53.500, ANGLE[k]).split(" ").map(Number);
        return (
          <text key={k} x={x} y={y + 3.500} textAnchor="middle" fontSize="9.500" fontWeight="700" className="fill-ink-soft">{k}</text>
        );
      })}
    </svg>
  );
}

function Fact({ icon, tint, label, value, hint }: { icon: ReactNode; tint: string; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tint}`}>{icon}</span>
      <div className="leading-snug">
        <dt className="text-xs text-ink-soft">{label}</dt>
        <dd className="font-bold">{value}</dd>
        {hint && <dd className="mt-0.5 text-sm font-normal text-ink-soft">{hint}</dd>}
      </div>
    </div>
  );
}

// กล่องฮวงจุ้ย: ทุกแถวของต้นนี้ + disclaimer; ไม่มีข้อมูล → ไม่ render (FR-013)
export async function FengShuiBox({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  const [t, room, dir, benefit, benefitInfo] = await Promise.all([
    getTranslations("Tree"), getTranslations("Room"), getTranslations("Direction"), getTranslations("Benefit"), getTranslations("BenefitInfo"),
  ]);

  return (
    <section data-testid="feng-shui-box" aria-labelledby="fs-title" className="card card-border bg-base-100">
      <div className="card-body gap-4 p-5 md:p-6">
        <h2 id="fs-title" className="card-title border-b border-base-300 pb-3 text-lg">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10" /><path d="m16.2 7.8-2 6.4-6.4 2 2-6.4z" /></svg>
          {t("fengShui")}
        </h2>

        {rows.map((r, i) => {
          const b = BENEFIT[r.benefit] ?? BENEFIT.WEALTH;
          return (
            <div key={i} className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-200/60 p-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <Compass direction={r.direction} label={dir(r.direction)} />
                <dl className="flex w-full flex-col gap-3">
                  <Fact icon={<Icon d={ROOM_ICON[r.room] ?? ROOM_ICON.LIVING} />} tint="bg-primary/10 text-primary" label={t("room")} value={room(r.room)} />
                  <Fact icon={<Icon d="m16.200 7.800-2 6.400-6.400 2 2-6.400z" />} tint="bg-accent/25 text-primary" label={t("direction")} value={dir(r.direction)} />
                  <Fact icon={<Icon d={b.d} />} tint={b.tint} label={t("benefit")} value={benefit(r.benefit)} hint={benefitInfo(r.benefit)} />
                </dl>
              </div>
              <p className="flex gap-3 rounded-field border-l-4 border-accent bg-base-100 p-4 leading-relaxed">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...stroke} className="mt-1 shrink-0 text-accent"><path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 17l.7 1.800 1.800.7-1.800.7L19 22l-.7-1.800-1.800-.7 1.800-.7z" /></svg>
                <span>{r.reason}</span>
              </p>
            </div>
          );
        })}

        <p className="text-center text-sm italic text-ink-soft">*{t("disclaimer")}</p>
      </div>
    </section>
  );
}
