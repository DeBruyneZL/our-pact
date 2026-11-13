package com.kiven.lpp.ourpact.travel.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.travel.entity.TravelFood;
import com.kiven.lpp.ourpact.travel.mapper.TravelFoodMapper;
import com.kiven.lpp.ourpact.travel.service.TravelFoodService;
import org.springframework.stereotype.Service;

/**
 * 旅行美食记录表服务实现。
 *
 * @author zhangliang
 */
@Service
public class TravelFoodServiceImpl extends ServiceImpl<TravelFoodMapper, TravelFood> implements TravelFoodService {
}
