FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx nest build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/db/seeds/mercomax.xlsx ./dist/src/db/seeds/mercomax.xlsx
COPY drizzle.config.ts ./
EXPOSE 3000
CMD ["node", "dist/src/main"]
