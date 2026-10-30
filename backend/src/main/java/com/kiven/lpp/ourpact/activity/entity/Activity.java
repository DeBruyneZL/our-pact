package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 活动。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_activity")
public class Activity extends BaseEntity {

    private String name;

    private LocalDateTime scheduledAt;

    private String location;

    private Long userId;

    /** 发起人一方人数 */
    private Integer peopleCount;

    /** 取值见 {@link com.kiven.lpp.ourpact.activity.ActivityStatus} */
    private String status;

    private String replyNote;

    private LocalDateTime repliedAt;

    private LocalDateTime withdrawnAt;

    private LocalDateTime completedAt;
}
