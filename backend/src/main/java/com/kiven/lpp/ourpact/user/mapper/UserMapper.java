package com.kiven.lpp.ourpact.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kiven.lpp.ourpact.user.dto.UserPageQuery;
import com.kiven.lpp.ourpact.user.entity.User;
import org.apache.ibatis.annotations.Param;

/**
 * 用户表 Mapper。通用 CRUD 由 MyBatis-Plus BaseMapper 提供。
 *
 * @author zhangliang
 */
public interface UserMapper extends BaseMapper<User> {

    /**
     * 按关键词分页查询未删除用户。
     */
    Page<User> queryByPage(Page<User> page, @Param("query") UserPageQuery query);
}
