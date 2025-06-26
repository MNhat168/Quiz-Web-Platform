# 🛠️ Stage 1: Build the JAR
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml ./
# pre-fetch dependencies to leverage cache
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# 🎯 Stage 2: Runtime (slim image)
FROM eclipse-temurin:17-jre-jammy
COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
