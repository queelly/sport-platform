FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m -XX:+UseSerialGC"

COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -Dmaven.test.skip=true -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S sportgroup && adduser -S sportuser -G sportgroup && \
    mkdir -p /var/lib/sportplatform/uploads && \
    chown -R sportuser:sportgroup /var/lib/sportplatform/uploads /app

COPY --from=build /app/target/sport-platform-backend-1.0.0.jar /app/app.jar

USER sportuser

EXPOSE 8080

ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "/app/app.jar"]
