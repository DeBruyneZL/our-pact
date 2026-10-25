package com.kiven.lpp.ourpact.menu.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 菜品。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("dish")
public class Dish extends BaseEntity {

    private Long categoryId;

    private String name;

    private String description;

    /** 磁盘文件名，对外换成可访问路径。清空图片时需要把 null 写回。 */
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String imageName;

    /** 取值见 {@link com.kiven.lpp.ourpact.common.YesNo} */
    private Integer isActive;

    private Integer sortOrder;
}
