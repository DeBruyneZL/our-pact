package com.kiven.lpp.ourpact.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.entity.User;

/**
 * 用户领域服务。
 *
 * @author zhangliang
 */
public interface UserService extends IService<User> {

    /**
     * 按用户名查询未删除的用户。
     *
     * @param username 登录名
     * @return 用户；不存在时返回 null
     */
    User findByUsername(String username);
}
