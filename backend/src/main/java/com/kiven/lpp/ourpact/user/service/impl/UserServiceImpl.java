package com.kiven.lpp.ourpact.user.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.common.YesNo;
import com.kiven.lpp.ourpact.user.dto.ProfileUpdateRequest;
import com.kiven.lpp.ourpact.user.dto.UserProfileResponse;
import com.kiven.lpp.ourpact.user.entity.User;
import com.kiven.lpp.ourpact.user.mapper.UserMapper;
import com.kiven.lpp.ourpact.user.service.AvatarStorage;
import com.kiven.lpp.ourpact.user.service.UserService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户登录与个人资料。
 *
 * @author zhangliang
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    /** 用户不存在时也走一次哈希比对，避免用响应时间区分账号。 */
    private static final String DUMMY_PASSWORD_HASH =
            "$2b$10$OtEDThUOrjuHzKuFT5HJQOXf6jVoDuA814f5HBxs99YlwJgu2lEyW";

    private final AvatarStorage avatarStorage;

    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(AvatarStorage avatarStorage, PasswordEncoder passwordEncoder) {
        this.avatarStorage = avatarStorage;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User findByUsername(String username) {
        return getOne(Wrappers.<User>lambdaQuery().eq(User::getUsername, username), false);
    }

    @Override
    public User authenticate(String account, String password) {
        String value = account == null ? "" : account.trim();
        String raw = password == null ? "" : password;
        User user = findByUsername(value);
        if (user == null) {
            user = findByPhone(value);
        }
        if (user == null) {
            passwordEncoder.matches(raw, DUMMY_PASSWORD_HASH);
            throw new BusinessException("账号或密码错误");
        }
        if (!passwordMatches(user, raw)) {
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
        requireUser(userId);
        String phone = request.getPhone().trim();
        User occupied = findByPhone(phone);
        if (occupied != null && !occupied.getId().equals(userId)) {
            throw new BusinessException("手机号已被使用");
        }
        String nickname = request.getNickname().trim();
        try {
            update(Wrappers.<User>lambdaUpdate()
                    .eq(User::getId, userId)
                    .set(User::getNickname, nickname)
                    .set(User::getPhone, phone));
        } catch (DuplicateKeyException exception) {
            throw new BusinessException("手机号已被使用");
        }
        User latest = getById(userId);
        if (latest == null) {
            throw new BusinessException("用户不存在");
        }
        return toProfile(latest);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public UserProfileResponse updateAvatar(Long userId, MultipartFile file) {
        User user = requireUser(userId);
        String previous = user.getAvatar();
        String storedName = avatarStorage.save(file);
        try {
            update(Wrappers.<User>lambdaUpdate()
                    .eq(User::getId, userId)
                    .set(User::getAvatar, storedName));
        } catch (RuntimeException exception) {
            avatarStorage.delete(storedName);
            throw exception;
        }
        User latest = getById(userId);
        if (latest == null || !storedName.equals(latest.getAvatar())) {
            avatarStorage.delete(storedName);
            throw new BusinessException("用户不存在");
        }
        if (!storedName.equals(previous)) {
            avatarStorage.delete(previous);
        }
        return toProfile(latest);
    }

    /**
     * 已是 BCrypt 时直接比对。历史明文匹配成功后立刻改写成哈希。
     */
    private boolean passwordMatches(User user, String raw) {
        String stored = user.getPassword();
        if (isPasswordHash(stored)) {
            return passwordEncoder.matches(raw, stored);
        }
        passwordEncoder.matches(raw, DUMMY_PASSWORD_HASH);
        if (stored == null || !stored.equals(raw)) {
            return false;
        }
        String hashed = passwordEncoder.encode(raw);
        update(Wrappers.<User>lambdaUpdate()
                .eq(User::getId, user.getId())
                .set(User::getPassword, hashed));
        user.setPassword(hashed);
        return true;
    }

    private boolean isPasswordHash(String stored) {
        return stored != null
                && (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$"));
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
