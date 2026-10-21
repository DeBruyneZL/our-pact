package com.kiven.lpp.ourpact.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.router.SaRouter;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sa-Token 路由拦截：除登录和头像读取外，/api 下的请求都要先登录。
 *
 * @author zhangliang
 */
@Configuration
public class SaTokenConfigure implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handle -> SaRouter.match("/api/**")
                        .notMatch("/api/auth/login", "/api/files/avatars/**")
                        .check(r -> StpUtil.checkLogin())))
                .addPathPatterns("/**");
    }
}
