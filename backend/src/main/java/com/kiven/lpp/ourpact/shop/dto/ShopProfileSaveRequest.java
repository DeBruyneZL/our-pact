package com.kiven.lpp.ourpact.shop.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存店铺介绍。图片先走上传接口，这里只收访问路径。
 *
 * @author zhangliang
 */
@Data
public class ShopProfileSaveRequest {

    @Size(max = 64, message = "一句话介绍不能超过 64 个字")
    private String slogan;

    @Size(max = 128, message = "地点不能超过 128 个字")
    private String location;

    @Size(max = 64, message = "接待时间不能超过 64 个字")
    private String openHours;

    @Size(max = 32, message = "可接待人数不能超过 32 个字")
    private String seatsText;

    @Size(max = 200, message = "今日说明不能超过 200 个字")
    private String notice;

    private String coverUrl;

    @Size(max = 32, message = "主厨名字不能超过 32 个字")
    private String chefName;

    @Size(max = 16, message = "主厨称呼不能超过 16 个字")
    private String chefTitle;

    @Size(max = 300, message = "主厨介绍不能超过 300 个字")
    private String chefIntro;

    private String chefAvatarUrl;
}
