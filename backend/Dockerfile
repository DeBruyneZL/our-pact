# 在镜像里编译，服务器上不必先执行 mvn package
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests

FROM crpi-9vrl30bdbouh839d.cn-chengdu.personal.cr.aliyuncs.com/kiven_lpp/eclipse-temurin:17-jdk
VOLUME /tmp
COPY --from=build /src/target/our-pact-backend-1.0.0.jar app.jar
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN echo 'Asia/Shanghai' > /etc/timezone
ENV JAVA_OPTS="-Xms256m -Xmx768m"
CMD hostname | xargs -I {} echo 127.0.0.1 {} >> /etc/hosts \
   && java -Djava.security.egd=file:/dev/./urandom $JAVA_OPTS -jar app.jar
