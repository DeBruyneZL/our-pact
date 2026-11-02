package com.kiven.lpp.ourpact.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

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
        clearFailedMigrations(dataSource);
        flyway.migrate();
        return flyway;
    }

    /**
     * 失败的版本会挡住后续启动。删掉失败记录后，用当前脚本重新执行。
     * 首次建库还没有历史表，忽略「表不存在」。
     */
    private void clearFailedMigrations(DataSource dataSource) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.executeUpdate("DELETE FROM flyway_schema_history WHERE success = 0");
        } catch (SQLException exception) {
            if (exception.getErrorCode() != 1146) {
                throw new IllegalStateException("清理失败的迁移记录失败", exception);
            }
        }
    }
}
