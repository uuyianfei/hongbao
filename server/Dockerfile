FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npx tsc

# --- Production ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# 数据目录
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5001
ENV DATABASE_URL="file:/app/data/hongbao.db"

EXPOSE 5001

# 启动时推送数据库 schema 并启动服务
CMD npx prisma db push --skip-generate && node dist/app.js
