package com.kiven.lpp.ourpact.user.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.user.dto.LoginRequest;
import com.kiven.lpp.ourpact.user.dto.LoginResponse;
import com.kiven.lpp.ourpact.user.dto.ProfileUpdateRequest;
import com.kiven.lpp.ourpact.user.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 登录与个人中心接口。登录态由 Sa-Token 签发。
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
     * 用户名或手机号加密码登录。
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request.getAccount(), request.getPassword());
        StpUtil.login(user.getId());
        UserProfileResponse profile = userService.toProfile(user);

        LoginResponse response = new LoginResponse();
        response.setToken(StpUtil.getTokenValue());
        response.setUserId(profile.getId());
        response.setUsername(profile.getUsername());
        response.setNickname(profile.getNickname());
        response.setPhone(profile.getPhone());
        response.setAvatar(profile.getAvatar());
        response.setSuperAdmin(profile.getSuperAdmin());
        return Result.success(response);
    }

    /**
     * 当前登录用户资料。
     */
    @GetMapping("/me")
    public Result<UserProfileResponse> currentUser() {
        User user = userService.getById(StpUtil.getLoginIdAsLong());
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return Result.success(userService.toProfile(user));
    }

    /**
     * 修改昵称和手机号。
     */
    @PostMapping("/profile")
    public Result<UserProfileResponse> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return Result.success(userService.updateProfile(StpUtil.getLoginIdAsLong(), request));
    }

    /**
     * 上传并替换头像。
     */
    @PostMapping("/avatar")
    public Result<UserProfileResponse> updateAvatar(@RequestParam("file") MultipartFile file) {
        return Result.success(userService.updateAvatar(StpUtil.getLoginIdAsLong(), file));
    }

    /**
     * 注销当前令牌。
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        StpUtil.logout();
        return Result.success();
    }
}
