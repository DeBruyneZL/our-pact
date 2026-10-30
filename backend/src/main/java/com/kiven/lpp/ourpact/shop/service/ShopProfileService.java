package com.kiven.lpp.ourpact.shop.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileResponse;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileSaveRequest;
import com.kiven.lpp.ourpact.shop.entity.ShopProfile;
import org.springframework.web.multipart.MultipartFile;

/**
 * 店铺介绍。登录即可读，写入仅超级管理员。
 *
 * @author zhangliang
 */
public interface ShopProfileService extends IService<ShopProfile> {

    /**
     * 当前介绍。还没配过时返回空字段。
     */
    ShopProfileResponse detail();

    /**
     * 保存介绍，并替换已换掉的图片文件。
     */
    ShopProfileResponse save(ShopProfileSaveRequest request);

    /**
     * 保存氛围图或主厨头像，返回可访问路径。
     */
    String uploadImage(MultipartFile file);
}
