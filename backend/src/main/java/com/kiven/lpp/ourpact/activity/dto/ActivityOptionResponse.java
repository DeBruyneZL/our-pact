package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

/**
 * 活动菜品特殊项快照。
 *
 * @author zhangliang
 */
@Data
public class ActivityOptionResponse {

    private Long id;

    private Long groupId;

    private Long valueId;

    private String groupName;

    private String optionLabel;
}
