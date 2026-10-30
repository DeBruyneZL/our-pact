package com.kiven.lpp.ourpact.shop.controller;

import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.shop.dto.ShopImageResponse;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileResponse;
import com.kiven.lpp.ourpact.shop.dto.ShopProfileSaveRequest;
import com.kiven.lpp.ourpact.shop.service.ShopProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 店铺介绍。查询登录即可，保存仅超级管理员。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopProfileService shopProfileService;

    public ShopController(ShopProfileService shopProfileService) {
        this.shopProfileService = shopProfileService;
    }

    /**
     * 当前店铺介绍。
     */
    @GetMapping
    public Result<ShopProfileResponse> detail() {
        return Result.success(shopProfileService.detail());
    }

    /**
     * 保存店铺介绍。
     */
    @PostMapping
    public Result<ShopProfileResponse> save(@Valid @RequestBody ShopProfileSaveRequest request) {
        return Result.success(shopProfileService.save(request));
    }

    /**
     * 上传氛围图或主厨头像，返回可写入介绍的访问路径。
     */
    @PostMapping("/image")
    public Result<ShopImageResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        ShopImageResponse response = new ShopImageResponse();
        response.setUrl(shopProfileService.uploadImage(file));
        return Result.success(response);
    }
}
