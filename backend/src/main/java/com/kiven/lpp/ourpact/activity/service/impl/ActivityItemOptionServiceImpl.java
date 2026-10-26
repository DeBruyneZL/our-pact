package com.kiven.lpp.ourpact.activity.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.activity.entity.ActivityItemOption;
import com.kiven.lpp.ourpact.activity.mapper.ActivityItemOptionMapper;
import com.kiven.lpp.ourpact.activity.service.ActivityItemOptionService;
import org.springframework.stereotype.Service;

/**
 * 活动菜品特殊项批量写入。
 *
 * @author zhangliang
 */
@Service
public class ActivityItemOptionServiceImpl extends ServiceImpl<ActivityItemOptionMapper, ActivityItemOption>
        implements ActivityItemOptionService {
}
