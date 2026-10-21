package com.kiven.lpp.ourpact.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * 启动时执行数据库迁移。使用 Flyway 7.15，社区版可以连 MySQL 5.7。
 *
 * @author zhangliang
 */
@Configuration
public class FlywayConfig {

    /**
     * 已有库会先记到基线版本 0，再执行之后的脚本。
     */
    @Bean
    @ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
    public Flyway flyway(DataSource dataSource,
                         @Value("${spring.flyway.locations:classpath:db/migration}") String locations,
                         @Value("${spring.flyway.baseline-on-migrate:true}") boolean baselineOnMigrate,
                         @Value("${spring.flyway.baseline-version:0}") String baselineVersion) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(locations.split(","))
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .encoding("UTF-8")
                .load();
        flyway.migrate();
        return flyway;
    }
}
