package com.kiven.lpp.ourpact.shop.dto;

import lombok.Data;

/**
 * 店铺介绍。图片是可访问路径，没有图时为 null。
 *
 * @author zhangliang
 */
@Data
public class ShopProfileResponse {

    private String slogan;

    private String location;

    private String openHours;

    private String seatsText;

    private String notice;

    private String coverUrl;

    private String chefName;

    private String chefTitle;

    private String chefIntro;

    private String chefAvatarUrl;
}
