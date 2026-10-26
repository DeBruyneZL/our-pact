package com.kiven.lpp.ourpact.activity.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.kiven.lpp.ourpact.activity.dto.ActivityPageQuery;
import com.kiven.lpp.ourpact.activity.entity.Activity;
import org.apache.ibatis.annotations.Param;

/**
 * 活动表 Mapper。
 *
 * @author zhangliang
 */
public interface ActivityMapper extends BaseMapper<Activity> {

    /**
     * 当前用户发起或参与的活动。
     */
    Page<Activity> queryMine(Page<Activity> page, @Param("query") ActivityPageQuery query);

    /**
     * 管理端查看全部活动。
     */
    Page<Activity> queryManage(Page<Activity> page, @Param("query") ActivityPageQuery query);
}
