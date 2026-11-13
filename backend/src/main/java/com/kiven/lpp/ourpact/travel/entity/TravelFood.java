package com.kiven.lpp.ourpact.travel.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 旅行美食记录。挂在点亮地点下面，和打卡照片分开记。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("trip_food")
public class TravelFood extends BaseEntity {

    private Long spotId;

    private String shopName;

    private String dishName;

    private String photoFileName;

    private String note;
}
