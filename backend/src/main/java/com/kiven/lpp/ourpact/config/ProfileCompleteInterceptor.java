package com.kiven.lpp.ourpact.config;

import cn.dev33.satoken.stp.StpUtil;
import com.kiven.lpp.ourpact.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;

/**
 * 头像或昵称还是默认值时，拦住会露出身份的操作。浏览、登录和改资料放行。
 *
 * @author zhangliang
 */
@Component
public class ProfileCompleteInterceptor implements HandlerInterceptor {

    /** 小程序里发起、加入、改活动、点菜、传照片。列表和后台答复不在这里。 */
    private static final List<String> GUARDED = List.of(
            "/api/activity",
            "/api/activity/*/join",
            "/api/activity/*/people",
            "/api/activity/*/leave",
            "/api/activity/*/update",
            "/api/activity/*/items",
            "/api/activity/*/items/*/delete",
            "/api/activity/*/withdraw",
            "/api/activity/*/complete",
            "/api/activity/*/photos",
            "/api/activity/*/photos/*/delete"
    );

    private final AntPathMatcher matcher = new AntPathMatcher();

    private final UserService userService;

    public ProfileCompleteInterceptor(UserService userService) {
        this.userService = userService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !StpUtil.isLogin()) {
            return true;
        }
        String path = requestPath(request);
        for (String pattern : GUARDED) {
            if (matcher.match(pattern, path)) {
                userService.requireCompletedProfile(StpUtil.getLoginIdAsLong());
                return true;
            }
        }
        return true;
    }

    private String requestPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        String context = request.getContextPath();
        if (context != null && !context.isEmpty() && path.startsWith(context)) {
            path = path.substring(context.length());
        }
        if (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }
}
