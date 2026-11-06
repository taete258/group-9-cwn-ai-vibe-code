import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CARES, SIZES, SORTS, SPECIES, type CatalogQuery } from "@/rules/catalog-query";
import { FilterPanel } from "./FilterPanel";

type Opt = { value: string; label: string };

// กลุ่มตัวเลือกแบบ chip: radio จริง (ใช้ได้โดยไม่ต้องมี JS) ซ่อน input ไว้ด้วย sr-only แล้วแต่ง label
function Chips({ name, label, options, value, testId, allLabel }: {
  name: string; label: string; options: Opt[]; value?: string; testId: string; allLabel: string;
}) {
  const all: Opt[] = [{ value: "", label: allLabel }, ...options];
  return (
    <fieldset data-testid={testId} className="mb-4">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} defaultChecked={(value ?? "") === o.value} className="peer sr-only" aria-label={o.label} />
            <span className="inline-flex min-h-12 items-center rounded-full border border-base-300 bg-base-200 px-4 text-sm font-medium text-ink-soft transition hover:bg-base-300 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-content peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export async function FilterBar({ query, collections }: { query: CatalogQuery; collections: { key: string; name: string }[] }) {
  const [t, species, care] = await Promise.all([getTranslations("Filter"), getTranslations("Species"), getTranslations("Care")]);

  return (
    <FilterPanel>
      <form method="get" role="search" className="flex flex-col">
        <label className="mb-4 flex flex-col gap-2">
          <span className="text-sm font-bold">{t("search")}</span>
          <input
            data-testid="search-input" type="search" name="q" defaultValue={query.q ?? ""} placeholder={t("placeholder")}
            className="input input-bordered w-full bg-base-100"
          />
        </label>
        <Chips testId="filter-collection" name="collection" label={t("collection")} allLabel={t("all")} value={query.collection}
          options={collections.map((c) => ({ value: c.key, label: c.name }))} />
        <Chips testId="filter-size" name="size" label={t("size")} allLabel={t("all")} value={query.size}
          options={SIZES.map((s) => ({ value: s, label: t(`sizes.${s}`) }))} />
        <Chips testId="filter-species" name="species" label={t("species")} allLabel={t("all")} value={query.species}
          options={SPECIES.map((s) => ({ value: s, label: species(s) }))} />
        <Chips testId="filter-care" name="care" label={t("care")} allLabel={t("all")} value={query.care}
          options={CARES.map((c) => ({ value: c, label: care(c) }))} />

        <label className="mb-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3">
          <input data-testid="filter-pet-safe" type="checkbox" name="petSafe" value="1" defaultChecked={query.petSafe} className="checkbox checkbox-primary" />
          <span className="text-sm font-medium">{t("petSafe")}</span>
        </label>

        <label className="mb-4 flex flex-col gap-2">
          <span className="text-sm font-bold">{t("sort")}</span>
          <select data-testid="sort-select" name="sort" defaultValue={query.sort} className="select select-bordered w-full bg-base-100">
            {SORTS.map((s) => <option key={s} value={s}>{t(`sorts.${s}`)}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Link data-testid="filter-reset" href="/trees" className="btn btn-outline">{t("reset")}</Link>
          <button type="submit" className="btn btn-primary">{t("apply")}</button>
        </div>
      </form>
    </FilterPanel>
  );
}
