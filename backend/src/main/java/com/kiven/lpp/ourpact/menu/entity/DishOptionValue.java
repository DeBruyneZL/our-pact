package com.kiven.lpp.ourpact.menu.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 特殊项里的一个可选值。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dish_option_value")
public class DishOptionValue extends BaseEntity {

    private Long groupId;

    private String label;

    private Integer sortOrder;
}
