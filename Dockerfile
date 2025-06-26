FROM openjdk:17
VOLUME /tmp
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} TheQuizWeb-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java","-jar","/TheQuizWeb-0.0.1-SNAPSHOT.jar"]
