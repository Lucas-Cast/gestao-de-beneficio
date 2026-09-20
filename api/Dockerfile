
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS build

WORKDIR /app
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS production-dependencies

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm cache clean --force

FROM ${NODE_IMAGE} AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
