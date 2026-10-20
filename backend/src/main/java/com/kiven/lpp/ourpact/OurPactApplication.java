package com.kiven.lpp.ourpact;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

/**
 * 你我约定后端启动类。
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
