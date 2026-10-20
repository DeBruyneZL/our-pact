package com.kiven.lpp.ourpact.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.dto.LoginRequest;
import com.kiven.lpp.ourpact.dto.LoginResponse;
import com.kiven.lpp.ourpact.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.entity.User;
import com.kiven.lpp.ourpact.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * 登录示例接口。账号来自 sys_user，登录态由 Sa-Token 签发。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 用户名密码登录。示例直接比对明文，正式环境应改为密码哈希。
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.findByUsername(request.getUsername());
        if (user == null || !Objects.equals(user.getPassword(), request.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        StpUtil.login(user.getId());

        LoginResponse response = new LoginResponse();
        response.setToken(StpUtil.getTokenValue());
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setNickname(displayName(user));
        return Result.success(response);
    }

    /**
     * 用当前令牌换取用户资料，供前端验证登录是否生效。
     */
    @GetMapping("/me")
    public Result<UserProfileResponse> currentUser() {
        User user = userService.getById(StpUtil.getLoginIdAsLong());
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setNickname(displayName(user));
        response.setCreateTime(user.getCreateTime());
        return Result.success(response);
    }

    /**
     * 注销当前令牌。
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        StpUtil.logout();
        return Result.success();
    }

    private String displayName(User user) {
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            return user.getUsername();
        }
        return user.getNickname();
    }
}
