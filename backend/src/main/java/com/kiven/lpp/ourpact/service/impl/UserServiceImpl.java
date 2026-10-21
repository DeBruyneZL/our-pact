package com.kiven.lpp.ourpact.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.dto.ProfileUpdateRequest;
import com.kiven.lpp.ourpact.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.entity.User;
import com.kiven.lpp.ourpact.mapper.UserMapper;
import com.kiven.lpp.ourpact.service.AvatarStorage;
import com.kiven.lpp.ourpact.service.UserService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

/**
 * 用户登录与个人资料。
 *
 * @author zhangliang
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final AvatarStorage avatarStorage;

    public UserServiceImpl(AvatarStorage avatarStorage) {
        this.avatarStorage = avatarStorage;
    }

    @Override
    public User findByUsername(String username) {
        return getOne(Wrappers.<User>lambdaQuery().eq(User::getUsername, username), false);
    }

    @Override
    public User authenticate(String account, String password) {
        String value = account == null ? "" : account.trim();
        User user = findByUsername(value);
        if (user == null) {
            user = findByPhone(value);
        }
        if (user == null || !Objects.equals(user.getPassword(), password)) {
            throw new BusinessException("账号或密码错误");
        }
        return user;
    }

    @Override
    public UserProfileResponse toProfile(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setNickname(displayName(user));
        response.setPhone(user.getPhone());
        response.setAvatar(avatarStorage.url(user.getAvatar()));
        response.setSuperAdmin(YesNo.YES.getValue().equals(user.getSuperAdmin()));
        response.setCreateTime(user.getCreateTime());
        return response;
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public UserProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = requireUser(userId);
        String phone = request.getPhone().trim();
        User occupied = findByPhone(phone);
        if (occupied != null && !occupied.getId().equals(userId)) {
            throw new BusinessException("手机号已被使用");
        }
        user.setNickname(request.getNickname().trim());
        user.setPhone(phone);
        try {
            updateById(user);
        } catch (DuplicateKeyException exception) {
            throw new BusinessException("手机号已被使用");
        }
        return toProfile(user);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public UserProfileResponse updateAvatar(Long userId, MultipartFile file) {
        User user = requireUser(userId);
        String previous = user.getAvatar();
        String storedName = avatarStorage.save(file);
        user.setAvatar(storedName);
        updateById(user);
        if (!storedName.equals(previous)) {
            avatarStorage.delete(previous);
        }
        return toProfile(user);
    }

    private User findByPhone(String phone) {
        return getOne(Wrappers.<User>lambdaQuery().eq(User::getPhone, phone), false);
    }

    private User requireUser(Long userId) {
        User user = getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return user;
    }

    private String displayName(User user) {
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            return user.getUsername();
        }
        return user.getNickname();
    }
}
