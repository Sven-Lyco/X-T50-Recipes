# Stage 1: React Build
# Exact Node.js release, so a build can never fall back to an older cached image.
# Dependabot (.github/dependabot.yml) opens a pull request for newer 24.x releases.
FROM node:24.22.3-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Spring Boot Build
FROM gradle:9-jdk25 AS backend-build
WORKDIR /app
COPY --chown=gradle:gradle . .
COPY --from=frontend-build /app/frontend/dist src/main/resources/static
RUN ./gradlew bootJar --no-daemon

# Stage 3: Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Security fixes for Alpine packages that are newer than the base image
RUN apk upgrade --no-cache
COPY --from=backend-build /app/build/libs/*.jar app.jar
EXPOSE 8080
# Workaround for CVE-2026-114938 ("Java4Shell"): disables the vulnerable Base64 intrinsic.
# Remove once the base image ships a fixed Temurin build (25.0.5.1 or newer).
ENTRYPOINT ["java", "-XX:-UseBASE64Intrinsics", "-jar", "app.jar"]