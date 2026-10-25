package com.kiven.lpp.ourpact.menu.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.kiven.lpp.ourpact.menu.entity.DishOptionGroup;
import com.kiven.lpp.ourpact.menu.mapper.DishOptionGroupMapper;
import com.kiven.lpp.ourpact.menu.service.DishOptionGroupService;
import org.springframework.stereotype.Service;

/**
 * 菜品特殊项持久化。
 *
 * @author zhangliang
 */
@Service
public class DishOptionGroupServiceImpl extends ServiceImpl<DishOptionGroupMapper, DishOptionGroup>
        implements DishOptionGroupService {
}
