package com.kiven.lpp.ourpact.config;

import com.kiven.lpp.ourpact.menu.service.DishImageStorage;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把菜品图片目录映射成可访问的静态资源。
 *
 * @author zhangliang
 */
@Configuration
public class DishResourceConfig implements WebMvcConfigurer {

    private final DishImageStorage dishImageStorage;

    public DishResourceConfig(DishImageStorage dishImageStorage) {
        this.dishImageStorage = dishImageStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/files/dishes/**")
                .addResourceLocations(dishImageStorage.resourceLocation());
    }
}
