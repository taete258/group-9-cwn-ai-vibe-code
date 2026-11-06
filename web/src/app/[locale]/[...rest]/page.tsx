import { Suspense } from "react";
import { notFound } from "next/navigation";

// path ที่ไม่มีในเว็บ (รวม prefix ภาษาที่ไม่รองรับ เช่น /fr/trees ที่ middleware ส่งมาเป็น /th/fr/trees)
// → not-found.tsx ของ segment นี้ ("ไม่พบหน้านี้") ภายใน layout ปกติของเว็บ
// อ่าน params ใน <Suspense> เพราะ route นี้ไม่มี generateStaticParams (cacheComponents ห้ามอ่านนอก Suspense)
async function Miss({ params }: { params: PageProps<"/[locale]/[...rest]">["params"] }): Promise<null> {
  await params;
  notFound();
}

export default function CatchAll(props: PageProps<"/[locale]/[...rest]">) {
  return (
    <Suspense>
      <Miss params={props.params} />
    </Suspense>
  );
}
