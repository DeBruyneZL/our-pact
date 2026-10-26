package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 活动里的一道菜。菜名是快照，菜单后来改名不影响这里。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_item")
public class ActivityItem extends BaseEntity {

    private Long activityId;

    private Long dishId;

    private String dishName;

    private String note;

    private Long addedByUserId;
}
