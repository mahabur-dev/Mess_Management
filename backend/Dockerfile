FROM node:22.14-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

COPY . .

# Generate Prisma client (no DB connection needed)
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Confirm build succeeded
RUN ls -la dist/main.js

EXPOSE 5001

# Run migrations then start (needs real DB at runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]