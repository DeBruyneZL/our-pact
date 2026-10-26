package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 发给管理员的活动通知。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_notice")
public class ActivityNotice extends BaseEntity {

    private Long activityId;

    /** 取值见 {@link com.kiven.lpp.ourpact.activity.ActivityNoticeType} */
    private String type;

    private String message;

    /** 取值见 {@link com.kiven.lpp.ourpact.common.YesNo} */
    private Integer readFlag;
}
