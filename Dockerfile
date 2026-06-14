# Stage 1: React Build
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Spring Boot Build
FROM gradle:8-jdk21 AS backend-build
WORKDIR /app
COPY --chown=gradle:gradle . .
COPY --from=frontend-build /app/frontend/dist src/main/resources/static
RUN gradle bootJar --no-daemon

# Stage 3: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]