#!/bin/sh
set -e

# Asegurarse de que el directorio assets exista
mkdir -p /usr/share/nginx/html/assets

# Crear el archivo env.js con la URL de la API inyectada (o el default)
cat <<EOF > /usr/share/nginx/html/assets/env.js
(function (window) {
  window.__env = window.__env || {};
  window.__env.apiUrl = '${API_URL:-http://localhost:8080}';
}(this));
EOF

# Ejecuta el comando por defecto (iniciar nginx)
exec "$@"
