package com.kiven.lpp.ourpact.config;

import com.kiven.lpp.ourpact.user.service.AvatarStorage;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 把头像目录映射成可访问的静态资源。
 *
 * @author zhangliang
 */
@Configuration
public class AvatarResourceConfig implements WebMvcConfigurer {

    private final AvatarStorage avatarStorage;

    public AvatarResourceConfig(AvatarStorage avatarStorage) {
        this.avatarStorage = avatarStorage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/files/avatars/**")
                .addResourceLocations(avatarStorage.resourceLocation());
    }
}
