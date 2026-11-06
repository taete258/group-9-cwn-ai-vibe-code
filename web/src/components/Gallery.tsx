"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

// แกลเลอรี (FR-012): ปัดดูบนมือถือ (daisyUI carousel = scroll-snap), จุดบอกตำแหน่ง, รูปย่อ, กดขยายใน <dialog> (daisyUI modal)
// รูปเดียว → ไม่มีตัวเลื่อน; ไม่มีรูป → รูปแทนที่
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("Tree");
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const many = images.length > 1;

  if (!images.length) {
    return (
      <div data-testid="gallery-placeholder" className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-box border border-base-300 bg-oat text-ink-soft md:aspect-[4/3] lg:aspect-square">
        <svg aria-hidden="true" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M12 22v-9" /><path d="M12 13c0-4 3-7 8-7 0 5-3 8-8 7Z" /><path d="M12 15c0-3-2-6-7-6 0 4 2 7 7 6Z" /></svg>
        {t("noPhoto")}
      </div>
    );
  }

  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  };
  const step = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div data-testid="gallery" className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-box border border-base-300 bg-oat">
        <div
          ref={track}
          className="carousel no-scrollbar aspect-square w-full md:aspect-[4/3] lg:aspect-square"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className="carousel-item relative h-full w-full cursor-zoom-in"
              onClick={() => { setIndex(i); dialog.current?.showModal(); }}
              aria-label={`${t("zoom")} — ${t("photo", { n: i + 1 })}`}
            >
              <Image src={src} alt={`${name} — ${t("photo", { n: i + 1 })}`} fill priority={i === 0} sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {many ? (
          <div className="flex gap-1.5" aria-hidden="true">
            {images.map((src, i) => (
              <span key={src} className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-base-300"}`} />
            ))}
          </div>
        ) : <span />}
        <button data-testid="gallery-zoom" type="button" className="btn btn-outline rounded-full border-base-300 bg-base-100 font-medium" onClick={() => dialog.current?.showModal()}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" /></svg>
          {t("zoom")}
        </button>
      </div>

      {many && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              data-testid="gallery-thumb"
              type="button"
              aria-label={t("photo", { n: i + 1 })}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`relative aspect-square overflow-hidden rounded-field border-2 transition ${i === index ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <dialog ref={dialog} data-testid="gallery-dialog" className="modal" aria-label={name}>
        <div className="modal-box max-w-4xl p-0">
          <div className="relative aspect-square w-full bg-oat md:aspect-[4/3]">
            <Image src={images[index]} alt={`${name} — ${t("photo", { n: index + 1 })}`} fill sizes="(min-width: 896px) 896px, 100vw" className="object-contain" />
          </div>
          <div className="flex items-center justify-between gap-2 p-3">
            {many ? (
              <div className="join">
                <button type="button" className="btn join-item" aria-label={t("prev")} onClick={() => step(-1)}>‹</button>
                <button data-testid="gallery-next" type="button" className="btn join-item" aria-label={t("next")} onClick={() => step(1)}>›</button>
              </div>
            ) : <span />}
            <span className="text-sm text-ink-soft">{index + 1} / {images.length}</span>
            <form method="dialog"><button className="btn btn-ghost">{t("close")}</button></form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button aria-label={t("close")}>{t("close")}</button></form>
      </dialog>
    </div>
  );
}
