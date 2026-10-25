package com.kiven.lpp.ourpact.menu.service;

import cn.dev33.satoken.stp.StpUtil;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.service.UserService;
import org.springframework.stereotype.Component;

/**
 * 菜单写操作只允许超级管理员。
 *
 * @author zhangliang
 */
@Component
public class MenuAccess {

    private final UserService userService;

    public MenuAccess(UserService userService) {
        this.userService = userService;
    }

    /**
     * 当前登录用户不是超级管理员时抛出业务异常。
     */
    public void requireAdmin() {
        User user = userService.getById(StpUtil.getLoginIdAsLong());
        if (user == null || !YesNo.YES.getValue().equals(user.getSuperAdmin())) {
            throw new BusinessException("需要超级管理员权限");
        }
    }
}
