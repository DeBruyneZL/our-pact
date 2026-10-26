package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 活动参与人。发起人记在活动上，这里只放后来加入的人。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_participant")
public class ActivityParticipant extends BaseEntity {

    private Long activityId;

    private Long userId;

    /** 该参与人一方人数 */
    private Integer peopleCount;
}
