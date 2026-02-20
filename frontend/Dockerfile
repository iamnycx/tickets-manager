FROM oven/bun:latest as builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 4173
CMD ["npx", "serve", "-s", "dist", "-l", "4173"]
