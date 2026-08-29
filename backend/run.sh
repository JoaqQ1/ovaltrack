#!/bin/bash
set -e

# 1. Bucle en segundo plano: vigila cambios en src/ y compila a target/classes
(
  while true; do
    inotifywait -r -e modify,create,delete,move ./src/
    echo "🔄 Cambio detectado en src/, recompilando..."
    mvn compile -DskipTests -q
  done
) &

# 2. Levanta Spring Boot en primer plano (DevTools reinicia al detectar target/classes actualizado)
exec mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.address=0.0.0.0 -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"