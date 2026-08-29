FROM maven:3.9-eclipse-temurin-21

WORKDIR /app

# Instalar inotify-tools para vigilar cambios en src/ y dos2unix para saltos de línea
RUN apt-get update && apt-get install -y --no-install-recommends \
    inotify-tools \
    dos2unix \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cachear dependencias
COPY pom.xml .
RUN mvn -q dependency:go-offline -B || true

COPY . .

# Asegurar permisos y formato Unix en scripts
RUN dos2unix run.sh mvnw 2>/dev/null || true
RUN chmod +x run.sh mvnw 2>/dev/null || true

EXPOSE 8080 5005

ENV PS1="[backend:\W]\$ "

CMD ["bash", "run.sh"]