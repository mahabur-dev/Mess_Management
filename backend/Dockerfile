FROM node:22.14-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

# Verify build output
RUN ls -la dist/

FROM node:22.14-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

USER nodejs

EXPOSE ${PORT:-5001}

# Run migrations then start app
CMD sh -c "npx prisma migrate deploy && node dist/main.js"