# # Stage 0, "build-stage", based on Node.js, to build and compile the frontend
# FROM node:24 AS build-stage
#
# WORKDIR /app
# # Install pnpm via npm (more reliable in Docker)
# RUN npm install -g pnpm
#
# COPY package*.json /app/
#
# COPY ./ /app/
# RUN pnpm install
#
#
#
# # ARG NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
#
# RUN pnpm run build
#
#
# # Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
# FROM nginx:1
#
# COPY --from=build-stage /app/dist/ /usr/share/nginx/html
#
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
# Stage 0: Build the frontend
# Stage 1: Build
# syntax=docker.io/docker/dockerfile:1

# syntax=docker/dockerfile:1


# frontend/Dockerfile

# Stage 1: Install dependencies
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Stage 3: Production runner (standalone mode)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Optional: copy package.json if needed for logging or metadata
COPY --from=builder /app/package.json .

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
