package com.kiven.lpp.ourpact.menu.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.menu.entity.DishOptionValue;
import com.kiven.lpp.ourpact.menu.mapper.DishOptionValueMapper;
import com.kiven.lpp.ourpact.menu.service.DishOptionValueService;
import org.springframework.stereotype.Service;

/**
 * 特殊项可选值持久化。
 *
 * @author zhangliang
 */
@Service
public class DishOptionValueServiceImpl extends ServiceImpl<DishOptionValueMapper, DishOptionValue>
        implements DishOptionValueService {
}
