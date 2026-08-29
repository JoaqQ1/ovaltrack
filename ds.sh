#!/usr/bin/env bash
# ds = Desarrollo de Software (IF012) — gestor del entorno OvalTrack
set -euo pipefail

PROJECT_NAME="ovaltrack"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

cd "$(dirname "$0")"

# Validaciones de entorno Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no está instalado o no está en el PATH. Instalalo antes de continuar."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker no está corriendo. Iniciá Docker Desktop / el daemon de Docker e intentá de nuevo."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f ".env.example" ]]; then
    echo "No existe $ENV_FILE, se crea automáticamente a partir de .env.example"
    cp .env.example "$ENV_FILE"
  else
    echo "Advertencia: No se encontró .env ni .env.example. Usando valores por defecto."
  fi
fi

# Cargar variables de entorno si el archivo existe
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

dc() {
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

cmd="${1:-}"
[[ $# -gt 0 ]] && shift

case "$cmd" in
  up)
    dc up -d --build
    echo ""
    echo "========================================="
    echo " OvalTrack levantado con éxito:"
    echo "  Frontend -> http://localhost:${FRONTEND_PORT:-4200}"
    echo "  Backend  -> http://localhost:${BACKEND_PORT:-8080}"
    echo "  DB       -> localhost:${DB_PORT:-5432} (BD: ${DB_NAME:-ovaltrack}, User: ${DB_USER:-APP})"
    echo "========================================="
    ;;
  down)
    dc down
    echo "Contenedores detenidos."
    ;;
  build)
    dc build "$@"
    ;;
  logs)
    dc logs -f "$@"
    ;;
  ps)
    dc ps
    ;;
  restart)
    dc restart "$@"
    ;;
  compile)
    echo "Compilando backend..."
    dc exec -t backend mvn compile -DskipTests
    ;;
  mvn)
    echo "Ejecutando Maven en backend: mvn $*"
    dc exec -t backend mvn "$@"
    ;;
  test)
    echo "Ejecutando tests (Cucumber.js) contra la API del backend..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --profile test run --rm testing
    ;;
  reset)
    read -r -p "Esto borra los volúmenes (incluye los datos de la base). ¿Continuar? [y/N] " confirm
    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
      dc down -v
      echo "Entorno y volúmenes reseteados con éxito."
    else
      echo "Operación cancelada."
    fi
    ;;
  backend)
    dc exec backend bash 2>/dev/null || dc exec backend sh
    ;;
  frontend)
    dc exec frontend sh
    ;;
  db)
    dc exec db psql -U "${DB_USER:-APP}" -d "${DB_NAME:-ovaltrack}"
    ;;
  *)
    cat <<EOF
Uso: ./ds.sh <comando>

Comandos disponibles:
  up        Construye (si hace falta) y levanta frontend, backend y base de datos
  down      Detiene los contenedores (no borra datos)
  build     Reconstruye las imágenes (todas, o pasá el nombre del servicio)
  logs      Sigue los logs de todos los servicios (o de uno: ./ds.sh logs backend)
  ps        Muestra el estado de los contenedores
  restart   Reinicia todos los servicios (o uno puntual: ./ds.sh restart db)
  compile   Compila el código Java en el contenedor (dispara DevTools)
  mvn       Ejecuta cualquier comando Maven (ej: ./ds.sh mvn clean install)
  test      Corre la suite de tests (Cucumber.js) contra el backend y se cierra sola
  reset     Baja el entorno y borra los volúmenes (pide confirmación)
  backend   Abre una terminal interactiva en el contenedor del backend
  frontend  Abre una terminal interactiva en el contenedor del frontend
  db        Abre una consola psql conectada a la base de datos
EOF
    exit 1
    ;;
esac