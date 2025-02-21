# OpenJDK 17 기반 이미지 사용
FROM openjdk:17

# 작업 디렉토리 설정
WORKDIR /app

# JAR 파일 복사
COPY build/libs/*.jar app.jar

# 컨테이너 실행 시 Spring Boot 실행
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]