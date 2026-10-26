package com.kiven.lpp.ourpact.activity.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.activity.entity.ActivityItem;
import com.kiven.lpp.ourpact.activity.mapper.ActivityItemMapper;
import com.kiven.lpp.ourpact.activity.service.ActivityItemService;
import org.springframework.stereotype.Service;

/**
 * 活动菜品批量写入。
 *
 * @author zhangliang
 */
@Service
public class ActivityItemServiceImpl extends ServiceImpl<ActivityItemMapper, ActivityItem> implements ActivityItemService {
}
