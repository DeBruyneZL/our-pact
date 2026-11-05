package com.kiven.lpp.ourpact.activity.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kiven.lpp.ourpact.activity.dto.DishOrderCount;
import com.kiven.lpp.ourpact.activity.entity.ActivityItem;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 活动菜品表 Mapper。
 *
 * @author zhangliang
 */
public interface ActivityItemMapper extends BaseMapper<ActivityItem> {

    /**
     * 锁住该活动下的菜再计数。普通 count 在可重复读下看不到刚提交的插入。
     */
    Integer lockCount(@Param("activityId") Long activityId);

    /**
     * 这些菜品各出现在多少个指定状态的活动里。同一活动内重复添加只计一次。
     */
    List<DishOrderCount> countByDishIds(@Param("dishIds") List<Long> dishIds, @Param("status") String status);
}
