package com.kiven.lpp.ourpact.travel.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.travel.entity.TravelSpot;
import com.kiven.lpp.ourpact.travel.mapper.TravelSpotMapper;
import com.kiven.lpp.ourpact.travel.service.TravelSpotService;
import org.springframework.stereotype.Service;

/**
 * 旅行地点表服务实现。
 *
 * @author zhangliang
 */
@Service
public class TravelSpotServiceImpl extends ServiceImpl<TravelSpotMapper, TravelSpot> implements TravelSpotService {
}
