import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartView } from "@/components/CartView";

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cart");

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-8 pt-6 md:px-8">
      <h1 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <CartView />
    </main>
  );
}
