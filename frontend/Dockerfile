# OvalTrack - Desarrollo Frontend (Angular PWA)
FROM node:20-alpine

# Herramientas base del sistema
RUN apk update && apk add --no-cache bash sudo

# Herramientas globales de Angular y TypeScript
RUN npm install -g typescript @angular/cli@18.2.0

# Directorio de trabajo alineado con docker-compose (/app)
WORKDIR /app

# Desactivar analytics de Angular CLI
ENV NG_CLI_ANALYTICS="false"
ENV PS1="[frontend:\W]\$ "

# Instalar dependencias con caché de capas
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto de desarrollo de Angular
EXPOSE 4200

# Servir con hot-reload habilitado para Docker mounts
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000", "--disable-host-check"]