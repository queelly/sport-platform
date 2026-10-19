FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S sportgroup && adduser -S sportuser -G sportgroup && \
    mkdir -p /var/lib/sportplatform/uploads && \
    chown -R sportuser:sportgroup /var/lib/sportplatform/uploads /app

COPY --from=build /app/target/sport-platform-backend-1.0.0.jar /app/app.jar

USER sportuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
