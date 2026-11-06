import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // ข้าม /api, ไฟล์ของ Next และไฟล์ที่มีนามสกุล
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
