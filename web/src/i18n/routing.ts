import { defineRouting } from "next-intl/routing";

// spec 9.1: /th/... และ /en/... ค่าเริ่มต้นไทย
export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
});
