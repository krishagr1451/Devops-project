# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for Next.js if needed, or stick to npm
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Disable telemetry and build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public directory
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to standard user
USER nextjs

EXPOSE 3000
ENV PORT 3000

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
