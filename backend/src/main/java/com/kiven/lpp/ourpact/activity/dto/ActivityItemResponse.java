package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

import java.util.List;

/**
 * 活动菜品。
 *
 * @author zhangliang
 */
@Data
public class ActivityItemResponse {

    private Long id;

    private Long dishId;

    private String dishName;

    /** 菜品封面访问路径，没有图时为 null。 */
    private String dishImageUrl;

    private String note;

    private List<ActivityOptionResponse> options;

    private Long addedByUserId;

    private String addedByUserName;

    /** 加菜人头像访问路径，没有时为 null。 */
    private String addedByUserAvatar;
}
