# SPA: збірка Vite → статичний nginx, що проксує backend-префікси на Laravel
# і WebSocket /app на Reverb (дзеркало server.proxy з vite.config.js).
#
# Образ не залежить від середовища: REVERB_APP_KEY / APP_DEBUG задаються env
# контейнера (PORTAL_REVERB_APP_KEY, PORTAL_APP_DEBUG → /config.js при старті),
# тому той самий тег промоутиться з test у prod без перезбирання.
#
# BASE_REGISTRY — префікс дзеркала базових образів у Gitea registry
# (напр. gitea.spsc.local/spsc-org/mirror/), щоб білд не ходив у Docker Hub.
ARG BASE_REGISTRY=

FROM ${BASE_REGISTRY}node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Лише build-time значення; ключ Reverb і debug — runtime (див. вище).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

ARG APP_VERSION=dev
ARG GIT_SHA=unknown
RUN printf '{"version":"%s","sha":"%s"}\n' "$APP_VERSION" "$GIT_SHA" > dist/version.json

FROM ${BASE_REGISTRY}nginx:1.27-alpine
ARG APP_VERSION=dev
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="portal-spa" \
      org.opencontainers.image.version="$APP_VERSION" \
      org.opencontainers.image.revision="$GIT_SHA"

# Офіційний entrypoint підставляє в шаблон лише задані env (API_UPSTREAM,
# REVERB_UPSTREAM), nginx-змінні ($host, $uri, ...) лишаються як є.
ENV API_UPSTREAM=http://host.docker.internal:8591 \
    REVERB_UPSTREAM=http://host.docker.internal:6001 \
    PORTAL_REVERB_APP_KEY=portal-key \
    PORTAL_APP_DEBUG= \
    APP_VERSION=$APP_VERSION
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/nginx/40-portal-config.sh /docker-entrypoint.d/40-portal-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/version.json || exit 1
