#!/bin/sh
# Виконується офіційним entrypoint nginx (/docker-entrypoint.d/*) при КОЖНОМУ старті
# контейнера: пише /config.js з env, тож один образ працює в test і prod.
# Читає src/lib/runtimeConfig.js. Значення екрануються як JSON-рядки.
set -eu

json_str() {
  # \ → \\, " → \", прибрати переводи рядків
  printf '%s' "$1" | tr -d '\r\n' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

OUT=/usr/share/nginx/html/config.js
cat > "$OUT" <<EOF
window.__PORTAL_CONFIG__ = {
  "REVERB_APP_KEY": "$(json_str "${PORTAL_REVERB_APP_KEY:-}")",
  "APP_DEBUG": "$(json_str "${PORTAL_APP_DEBUG:-}")",
  "APP_VERSION": "$(json_str "${APP_VERSION:-unknown}")"
}
EOF
echo "40-portal-config: wrote $OUT (version ${APP_VERSION:-unknown})"
