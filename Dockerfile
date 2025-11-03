FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV PORT=3000 \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=llm_engine \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    ENCRYPTION_KEY=default-secret-key-change-in-production

EXPOSE 3000

CMD ["node", "dist/index.js"]
