package com.kiven.lpp.ourpact.config;

import com.kiven.lpp.ourpact.travel.service.TravelPhotoStorage;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把旅行照片目录映射成可访问的静态资源。
 *
 * @author zhangliang
 */
@Configuration
public class TravelResourceConfig implements WebMvcConfigurer {

    private final TravelPhotoStorage travelPhotoStorage;

    public TravelResourceConfig(TravelPhotoStorage travelPhotoStorage) {
        this.travelPhotoStorage = travelPhotoStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/files/travels/**")
                .addResourceLocations(travelPhotoStorage.resourceLocation());
    }
}
