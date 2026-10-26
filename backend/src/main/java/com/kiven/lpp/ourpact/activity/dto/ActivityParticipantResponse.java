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

    /** 头像访问路径，没有时为 null。 */
    private String avatar;

    /** 是否活动发起人 */
    private Boolean owner;

    /** 这一方来几个人 */
    private Integer peopleCount;
}
