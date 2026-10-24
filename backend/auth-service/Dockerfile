# Stage 1: Build the application using Java 21 & Maven
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies by copying pom files first
COPY pom.xml .
COPY auth-service/pom.xml auth-service/
COPY task-service/pom.xml task-service/
COPY stats-service/pom.xml stats-service/
RUN mvn dependency:go-offline -B -pl auth-service -am || true

# Copy source code and build
COPY auth-service/src auth-service/src
RUN mvn clean package -pl auth-service -am -DskipTests

# Stage 2: Minimal Java 21 JRE runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security best practices
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow
USER taskflow

COPY --from=builder /workspace/auth-service/target/auth-service-*.jar app.jar

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
