FROM crpi-9vrl30bdbouh839d.cn-chengdu.personal.cr.aliyuncs.com/kiven_lpp/eclipse-temurin:17-jdk
VOLUME /tmp
ADD ./target/our-pact-backend-1.0.0.jar app.jar
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN echo 'Asia/Shanghai' > /etc/timezone
CMD hostname | xargs -I {} echo 127.0.0.1 {} >> /etc/hosts \
   && java -Djava.security.egd=file:/dev/./urandom -Xmx2048m -Xms1024m -jar app.jar
