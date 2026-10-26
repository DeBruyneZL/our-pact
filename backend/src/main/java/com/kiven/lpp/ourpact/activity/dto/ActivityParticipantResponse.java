package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

/**
 * 活动参与人。
 *
 * @author zhangliang
 */
@Data
public class ActivityParticipantResponse {

    private Long id;

    private String name;

    /** 这一方来几个人 */
    private Integer peopleCount;
}
