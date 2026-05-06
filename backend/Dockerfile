FROM node:22.14-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5001

CMD ["node", "dist/main.js"]