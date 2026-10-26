package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 活动照片。
 *
 * @author zhangliang
 */
@Data
public class ActivityPhotoResponse {

    private Long id;

    private Long userId;

    private String userName;

    private String url;

    private LocalDateTime createdAt;
}
