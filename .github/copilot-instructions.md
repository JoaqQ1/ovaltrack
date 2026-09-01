# Instrucciones de Contexto para GitHub Copilot

## 1. Entorno de Ejecución
- **Sistema Operativo**: macOS (entorno Unix/POSIX, comandos compatibles con bash/zsh).

## 2. Variables de Entorno y Configuración
- **Archivo de configuración local**: Las variables de entorno necesarias para la conexión con OpenProject se encuentran en el archivo `.env.openproject.local` en la raíz del proyecto.
- **Manejo de variables**:
  - Al ejecutar scripts, comandos o tareas que interactúen con OpenProject, carga o referencia siempre los valores desde `.env.openproject.local`.
  - NUNCA insertes valores de tokens, API keys, URLs sensibles o credenciales en texto plano (*hardcoded*).
  - Al generar sugerencias de código o comandos de terminal, usa sintaxis de lectura de variables de entorno compatible con macOS (por ejemplo, `export $(cat .env.openproject.local | xargs)` o mediante el gestor de entorno del lenguaje en uso).

## 3. Pautas de Respuesta
- Prioriza soluciones nativas compatibles con macOS.
- Mantén las explicaciones directas y el código modular.
- Si se requiere autenticación contra la API de OpenProject, asume que la URL base y el token de acceso provienen de `.env.openproject.local`.