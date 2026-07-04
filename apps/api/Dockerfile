FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY scripts/apply-patches-if-available.js ./scripts/apply-patches-if-available.js
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set maxsockets 1 \
  && npm config set fetch-retries 8 \
  && npm config set fetch-retry-mintimeout 10000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 120000 \
  && npm ci --workspace @mi-san/api --include-workspace-root=false --no-audit --no-fund --prefer-offline --loglevel http
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json
EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:migrate:deploy && node dist/src/main.js"]
