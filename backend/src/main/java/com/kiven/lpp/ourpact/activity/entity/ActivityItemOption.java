package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 活动菜品的特殊项快照。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_item_option")
public class ActivityItemOption extends BaseEntity {

    private Long itemId;

    private String groupName;

    private String optionLabel;
}
