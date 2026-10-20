package com.kiven.lpp.ourpact.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.entity.User;
import com.kiven.lpp.ourpact.mapper.UserMapper;
import com.kiven.lpp.ourpact.service.UserService;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现，演示 MyBatis-Plus 条件查询。
 *
 * @author zhangliang
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public User findByUsername(String username) {
        return getOne(Wrappers.<User>lambdaQuery().eq(User::getUsername, username), false);
    }
}
