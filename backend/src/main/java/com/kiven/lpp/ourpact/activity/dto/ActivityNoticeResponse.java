package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理员看到的活动通知。
 *
 * @author zhangliang
 */
@Data
public class ActivityNoticeResponse {

    private Long id;

    private String type;

    private Long activityId;

    private String message;

    private LocalDateTime createdAt;

    private boolean read;
}
