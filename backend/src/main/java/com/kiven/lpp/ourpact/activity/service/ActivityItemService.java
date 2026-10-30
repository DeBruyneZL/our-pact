package com.kiven.lpp.ourpact.activity.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.kiven.lpp.ourpact.activity.entity.ActivityItem;

/**
 * 活动菜品批量写入。
 *
 * @author zhangliang
 */
public interface ActivityItemService extends IService<ActivityItem> {

    /**
     * 锁住该活动下的菜并返回数量。
     */
    int lockCount(Long activityId);
}
