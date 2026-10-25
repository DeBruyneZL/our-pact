package com.kiven.lpp.ourpact.menu.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 菜品分类。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dish_category")
public class DishCategory extends BaseEntity {

    private String name;

    private Integer sortOrder;
}
