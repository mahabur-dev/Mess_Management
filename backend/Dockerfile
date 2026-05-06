FROM node:22.14-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps including dev (needed for nest build)
RUN npm ci --include=dev

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Verify build output
RUN ls -la dist/main.js

# ---- Production stage ----
FROM node:22.14-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install only production deps
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]