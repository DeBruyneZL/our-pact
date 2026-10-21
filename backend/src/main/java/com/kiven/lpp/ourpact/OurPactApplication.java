package com.kiven.lpp.ourpact;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

/**
 * 饭否后端启动类。
 * 排除 Flyway 自动配置：Spring Boot 3.3 按 Flyway 10 调用迁移，和 7.15 的方法签名对不上。
 *
 * @author zhangliang
 */
@SpringBootApplication(exclude = FlywayAutoConfiguration.class)
@MapperScan("com.kiven.lpp.ourpact.mapper")
public class OurPactApplication {

    public static void main(String[] args) {
        SpringApplication.run(OurPactApplication.class, args);
    }
}
