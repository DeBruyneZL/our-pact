package com.kiven.lpp.ourpact.config;

import com.kiven.lpp.ourpact.shop.service.ShopImageStorage;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把店铺图片目录映射成可访问的静态资源。
 *
 * @author zhangliang
 */
@Configuration
public class ShopResourceConfig implements WebMvcConfigurer {

    private final ShopImageStorage shopImageStorage;

    public ShopResourceConfig(ShopImageStorage shopImageStorage) {
        this.shopImageStorage = shopImageStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/files/shop/**")
                .addResourceLocations(shopImageStorage.resourceLocation());
    }
}
