package com.kiven.lpp.ourpact.activity.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kiven.lpp.ourpact.activity.entity.ActivityPhoto;
import org.apache.ibatis.annotations.Param;

/**
 * 活动照片表 Mapper。
 *
 * @author zhangliang
 */
public interface ActivityPhotoMapper extends BaseMapper<ActivityPhoto> {

    /**
     * 锁住该活动下的照片再计数。普通 count 在可重复读下看不到刚提交的插入。
     */
    Integer lockCount(@Param("activityId") Long activityId);
}
