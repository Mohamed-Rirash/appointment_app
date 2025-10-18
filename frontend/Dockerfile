# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.7.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Enable standalone output
ENV NEXT_PRIVATE_STANDALONE=true

# Build Next.js app
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./public/_next/static
COPY --from=base --chown=nextjs:nodejs /app/public ./public

USER nextjs

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "server.js"]
