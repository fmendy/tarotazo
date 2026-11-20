# syntax=docker/dockerfile:1.7
# Tarotazo (arcana) — API Spring Boot (Java 25).
# CONTEXTO DE BUILD = RAÍZ DEL REPO (el jar empaqueta ../content):
#   docker build -f api/Dockerfile -t arcana-api .

ARG JAVA_VERSION=25

############################
# 1) Compilación (JDK + Maven wrapper)
############################
FROM eclipse-temurin:${JAVA_VERSION}-jdk-alpine AS build
WORKDIR /src/api

# Primero sólo lo necesario para resolver dependencias (capa cacheable).
COPY api/.mvn/ .mvn/
COPY api/mvnw api/pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -q -ntp dependency:go-offline || true

# Contenido (el pom lo referencia como ../content) y código.
COPY content/ /src/content/
COPY api/src/ src/
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B -ntp -DskipTests package \
 && JAR="$(ls target/*.jar | grep -v -E '(-plain|-sources|-javadoc|-tests)\.jar$' | head -n 1)" \
 && test -n "$JAR" && cp "$JAR" /app.jar

############################
# 2) Runtime: JRE 25, usuario no root, FS de solo lectura
############################
FROM eclipse-temurin:${JAVA_VERSION}-jre-alpine AS runtime

LABEL org.opencontainers.image.title="arcana-api" \
      org.opencontainers.image.description="Tarotazo — API sin estado (Spring Boot, Java 25)" \
      org.opencontainers.image.source="https://github.com/OWNER/arcana"

RUN addgroup -S -g 10001 arcana \
 && adduser -S -D -H -u 10001 -G arcana -h /app -s /sbin/nologin arcana
WORKDIR /app
# El jar pertenece a root y es de solo lectura para el usuario de ejecución.
COPY --from=build --chown=root:root --chmod=0444 /app.jar /app/app.jar

# Límites de memoria relativos al límite del contenedor (cgroups).
#  - MaxRAMPercentage: heap = 75 % del límite (deja sitio a metaspace, hilos, NIO).
#  - -XX:-UsePerfData: no escribe hsperfdata en /tmp.
#  - ExitOnOutOfMemoryError: que Docker reinicie en vez de quedar zombi.
ENV JAVA_TOOL_OPTIONS="-XX:InitialRAMPercentage=25 -XX:MaxRAMPercentage=75 -XX:MaxMetaspaceSize=160m -XX:ReservedCodeCacheSize=64m -Xss512k -XX:+ExitOnOutOfMemoryError -XX:-UsePerfData -Djava.io.tmpdir=/tmp -Djava.security.egd=file:/dev/urandom -Dfile.encoding=UTF-8" \
    SERVER_PORT=8080 \
    MANAGEMENT_PORT=8080

USER 10001:10001
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${MANAGEMENT_PORT}/actuator/health" || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
