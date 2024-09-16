FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* .yarnrc.yml ./
COPY packages/bet-dapp/package.json ./packages/bet-dapp/

RUN corepack enable
RUN yarn set version 4.2.2

RUN \
  yarn install

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

ENV NEXT_PUBLIC_URL=https://hathor.network/betting2024
ENV NEXT_PUBLIC_BASE_PATH=/betting2024/public

COPY packages/bet-dapp ./packages/bet-dapp
RUN cp ./packages/bet-dapp/next.config.production.mjs ./packages/bet-dapp/next.config.mjs

RUN \
  yarn workspace bet-dapp run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# # Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/packages/bet-dapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/bet-dapp/public ./packages/bet-dapp/public/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/bet-dapp/.next/static ./packages/bet-dapp/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/classic-level ./node_modules/classic-level

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "packages/bet-dapp/server.js"]