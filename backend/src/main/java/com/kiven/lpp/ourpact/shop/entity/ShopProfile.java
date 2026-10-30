package com.kiven.lpp.ourpact.shop.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 店铺介绍。全表只使用一行。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("shop_profile")
public class ShopProfile extends BaseEntity {

    private String slogan;

    private String location;

    private String openHours;

    private String seatsText;

    private String notice;

    /** 氛围图文件名。清空时需要把 null 写回。 */
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String coverName;

    private String chefName;

    private String chefTitle;

    private String chefIntro;

    /** 主厨头像文件名。清空时需要把 null 写回。 */
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String chefAvatarName;
}
