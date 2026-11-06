import { defineConfig, devices } from "@playwright/test";

// พอร์ต 3000 อาจถูกโปรเจกต์อื่นใช้ ตั้ง BASE_URL เอง เช่น BASE_URL=http://localhost:3001
// 3 เบราว์เซอร์ (chromium, firefox, webkit) จอ 375px; รันเฉพาะตัวเดียว: npx playwright test --project=firefox
const viewport = { width: 375, height: 812 };
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", viewport },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport } },
  ],
});
