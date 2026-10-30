package com.kiven.lpp.ourpact.shop.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.menu.service.MenuAccess;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileResponse;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileSaveRequest;
import com.kiven.lpp.ourpact.shop.entity.ShopProfile;
import com.kiven.lpp.ourpact.shop.mapper.ShopProfileMapper;
import com.kiven.lpp.ourpact.shop.service.ShopImageStorage;
import com.kiven.lpp.ourpact.shop.service.ShopProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 店铺介绍只维护一行。图片路径先还原成文件名再落库。
 *
 * @author zhangliang
 */
@Service
public class ShopProfileServiceImpl extends ServiceImpl<ShopProfileMapper, ShopProfile> implements ShopProfileService {

    private final ShopImageStorage imageStorage;

    private final MenuAccess menuAccess;

    public ShopProfileServiceImpl(ShopImageStorage imageStorage, MenuAccess menuAccess) {
        this.imageStorage = imageStorage;
        this.menuAccess = menuAccess;
    }

    @Override
    public ShopProfileResponse detail() {
        ShopProfile profile = find();
        if (profile == null) {
            return empty();
        }
        return toResponse(profile);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public ShopProfileResponse save(ShopProfileSaveRequest request) {
        menuAccess.requireAdmin();
        String coverName = storedImage(request.getCoverUrl(), "氛围图无效，请重新上传");
        String avatarName = storedImage(request.getChefAvatarUrl(), "主厨头像无效，请重新上传");
        ShopProfile profile = find();
        String previousCover = null;
        String previousAvatar = null;
        if (profile == null) {
            profile = new ShopProfile();
        } else {
            previousCover = profile.getCoverName();
            previousAvatar = profile.getChefAvatarName();
        }
        apply(profile, request, coverName, avatarName);
        if (profile.getId() == null) {
            super.save(profile);
        } else {
            updateById(profile);
        }
        deleteAfterCommit(previousCover, coverName, avatarName);
        deleteAfterCommit(previousAvatar, avatarName, coverName);
        return toResponse(profile);
    }

    @Override
    public String uploadImage(MultipartFile file) {
        menuAccess.requireAdmin();
        return imageStorage.url(imageStorage.save(file));
    }

    private ShopProfile find() {
        List<ShopProfile> rows = list(Wrappers.<ShopProfile>lambdaQuery().orderByAsc(ShopProfile::getId));
        if (rows.isEmpty()) {
            return null;
        }
        return rows.get(0);
    }

    private void apply(ShopProfile profile, ShopProfileSaveRequest request, String coverName, String avatarName) {
        profile.setSlogan(clean(request.getSlogan()));
        profile.setLocation(clean(request.getLocation()));
        profile.setOpenHours(clean(request.getOpenHours()));
        profile.setSeatsText(clean(request.getSeatsText()));
        profile.setNotice(clean(request.getNotice()));
        profile.setChefName(clean(request.getChefName()));
        profile.setChefTitle(clean(request.getChefTitle()));
        profile.setChefIntro(clean(request.getChefIntro()));
        profile.setCoverName(coverName);
        profile.setChefAvatarName(avatarName);
    }

    /** 只校验路径，不删文件。删文件放到事务提交之后。 */
    private String storedImage(String imageUrl, String invalidMessage) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        String name = imageStorage.storedName(imageUrl.trim());
        if (name == null) {
            throw new BusinessException(invalidMessage);
        }
        return name;
    }

    /** 旧文件不再被氛围图或头像引用时，等事务提交成功再删。 */
    private void deleteAfterCommit(String previous, String current, String otherCurrent) {
        if (previous == null || previous.equals(current) || previous.equals(otherCurrent)) {
            return;
        }
        String storedName = previous;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            imageStorage.delete(storedName);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                imageStorage.delete(storedName);
            }
        });
    }

    private ShopProfileResponse toResponse(ShopProfile profile) {
        ShopProfileResponse response = new ShopProfileResponse();
        response.setSlogan(clean(profile.getSlogan()));
        response.setLocation(clean(profile.getLocation()));
        response.setOpenHours(clean(profile.getOpenHours()));
        response.setSeatsText(clean(profile.getSeatsText()));
        response.setNotice(clean(profile.getNotice()));
        response.setCoverUrl(imageStorage.url(profile.getCoverName()));
        response.setChefName(clean(profile.getChefName()));
        response.setChefTitle(clean(profile.getChefTitle()));
        response.setChefIntro(clean(profile.getChefIntro()));
        response.setChefAvatarUrl(imageStorage.url(profile.getChefAvatarName()));
        return response;
    }

    private ShopProfileResponse empty() {
        ShopProfileResponse response = new ShopProfileResponse();
        response.setSlogan("");
        response.setLocation("");
        response.setOpenHours("");
        response.setSeatsText("");
        response.setNotice("");
        response.setChefName("");
        response.setChefTitle("");
        response.setChefIntro("");
        return response;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
