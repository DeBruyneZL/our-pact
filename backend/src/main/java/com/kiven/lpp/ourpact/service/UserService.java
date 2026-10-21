package com.kiven.lpp.ourpact.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.dto.ProfileUpdateRequest;
import com.kiven.lpp.ourpact.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.entity.User;
import org.springframework.web.multipart.MultipartFile;

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

    /**
     * 用户名或手机号加密码登录。失败时抛出业务异常。
     */
    User authenticate(String account, String password);

    /**
     * 组装对外资料，头像换成可访问路径。
     */
    UserProfileResponse toProfile(User user);

    /**
     * 修改当前用户的昵称和手机号。
     */
    UserProfileResponse updateProfile(Long userId, ProfileUpdateRequest request);

    /**
     * 替换当前用户头像，并删掉上一张。
     */
    UserProfileResponse updateAvatar(Long userId, MultipartFile file);
}
