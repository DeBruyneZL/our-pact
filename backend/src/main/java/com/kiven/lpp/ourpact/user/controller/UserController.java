package com.kiven.lpp.ourpact.user.controller;

import com.kiven.lpp.ourpact.common.PageResult;
import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.user.dto.UserAdminUpdateRequest;
import com.kiven.lpp.ourpact.user.dto.UserPageQuery;
import com.kiven.lpp.ourpact.user.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端用户查询。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 分页查询登录用户。
     */
    @PostMapping("/page")
    public Result<PageResult<UserProfileResponse>> page(@Valid @RequestBody UserPageQuery query) {
        return Result.success(userService.page(query));
    }

    /**
     * 设置或取消超级管理员。
     */
    @PostMapping("/{id}/admin")
    public Result<UserProfileResponse> updateAdmin(
            @PathVariable Long id, @Valid @RequestBody UserAdminUpdateRequest request) {
        return Result.success(userService.updateSuperAdmin(id, request));
    }
}
