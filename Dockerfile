# SPA: збірка Vite → статичний nginx, що проксує backend-префікси на Laravel
# і WebSocket /app на Reverb (дзеркало server.proxy з vite.config.js).

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# VITE_* вшиваються в бандл під час білду — змінюються лише перезбиранням образу.
ARG VITE_API_URL=
ARG VITE_REVERB_APP_KEY=portal-key
ARG VITE_APP_DEBUG=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_APP_DEBUG=$VITE_APP_DEBUG

RUN npm run build

FROM nginx:1.27-alpine
# Офіційний entrypoint підставляє в шаблон лише задані env (API_UPSTREAM,
# REVERB_UPSTREAM), nginx-змінні ($host, $uri, ...) лишаються як є.
ENV API_UPSTREAM=http://host.docker.internal:8591 \
    REVERB_UPSTREAM=http://host.docker.internal:6001
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
