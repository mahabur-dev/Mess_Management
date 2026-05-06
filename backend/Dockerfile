FROM node:22.14-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --include=dev

COPY . .

RUN npx prisma generate

RUN npm run build 2>&1 && echo "✅ Build successful" || (echo "❌ Build failed" && exit 1)

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

FROM node:22.14-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]