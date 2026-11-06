# ponytail: image เดียว ไม่แยก standalone เพราะต้องมี prisma CLI ไว้รัน migrate ตอนเริ่ม
# ถ้าขนาด image เริ่มเป็นปัญหา ค่อยแยก stage migrate ออกจาก runner
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
