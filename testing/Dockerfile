# testing/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Instalar dependencias aprovechando la caché de capas de Docker
COPY package*.json ./
RUN npm install

# Copiar el resto del código de pruebas (features, step definitions y configs)
COPY . .

# Comando por defecto para correr cucumber-js
CMD ["npm", "test"]