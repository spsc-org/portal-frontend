# Portal — SPA

React 18 + Vite 8 + react-router 7 (data mode) + MobX / TanStack Query. Фронтенд до Laravel API
(Sanctum SPA cookie auth, Reverb). Архітектура й конвенції — у `CLAUDE.md`.

## Розробка

```sh
cp .env.example .env   # адреси локального Laravel (8591) і Reverb (6001)
npm install
npm run dev            # http://localhost:3000, проксі на бекенд — vite.config.js
npm run lint
npm run build          # dist/
```

## Docker (тест / прод)

Образ: `npm run build` → `nginx:1.27-alpine`. Nginx віддає `dist/` з SPA-fallback і проксує
backend-префікси (`/api`, `/sanctum`, `/broadcasting`, `/storage`, експорти, …) та WebSocket `/app`
так само, як dev-сервер (`docker/nginx/default.conf.template`). Браузер бачить один origin, CORS не
потрібен.

```sh
cp docker/.env.example docker/.env      # SPA_PORT, API_UPSTREAM, REVERB_UPSTREAM
docker compose --env-file docker/.env up -d --build
# http://<host>:8090
```

| Змінна | Коли | Опис |
|---|---|---|
| `API_UPSTREAM` | runtime | Laravel, напр. `http://host.docker.internal:8080` |
| `REVERB_UPSTREAM` | runtime | Reverb, напр. `http://host.docker.internal:6001` |
| `SPA_PORT` | runtime | порт на хості (default `8090`) |
| `VITE_REVERB_APP_KEY` | build | `REVERB_APP_KEY` бекенду |
| `VITE_API_URL` | build | порожньо = той самий origin (рекомендовано) |

Зміна runtime-змінних → `docker compose up -d`; build-змінних → `--build`.

### Що налаштувати на бекенді

- `SANCTUM_STATEFUL_DOMAINS` — додати `host:port`, який бачить браузер (напр. `192.168.1.50:8090`).
- `SESSION_SECURE_COOKIE=false`, якщо SPA відкривається по `http` (інакше cookie не ставиться
  і логін мовчки не проходить); `SESSION_DOMAIN=` порожній.
- Reverb запущений: `php artisan reverb:start --host=0.0.0.0 --port=6001`.
- `TrustProxies` пропускає заголовки від nginx SPA (`X-Forwarded-*`).
