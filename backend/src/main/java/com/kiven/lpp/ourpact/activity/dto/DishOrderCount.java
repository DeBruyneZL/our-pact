package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

/**
 * 菜品在已完成活动中被点过的次数。同一活动只计一次。
 *
 * @author zhangliang
 */
@Data
public class DishOrderCount {

    private Long dishId;

    private Integer orderCount;
}
