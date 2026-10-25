package com.kiven.lpp.ourpact.menu.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 菜品特殊项，例如辣度、份量。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dish_option_group")
public class DishOptionGroup extends BaseEntity {

    private Long dishId;

    private String name;

    private Integer sortOrder;
}
