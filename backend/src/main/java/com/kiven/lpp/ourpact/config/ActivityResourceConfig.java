package com.kiven.lpp.ourpact.config;

import com.kiven.lpp.ourpact.activity.service.ActivityPhotoStorage;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把活动照片目录映射成可访问的静态资源。
 *
 * @author zhangliang
 */
@Configuration
public class ActivityResourceConfig implements WebMvcConfigurer {

    private final ActivityPhotoStorage activityPhotoStorage;

    public ActivityResourceConfig(ActivityPhotoStorage activityPhotoStorage) {
        this.activityPhotoStorage = activityPhotoStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/files/activities/**")
                .addResourceLocations(activityPhotoStorage.resourceLocation());
    }
}
