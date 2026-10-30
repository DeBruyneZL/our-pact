package com.kiven.lpp.ourpact.activity.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kiven.lpp.ourpact.activity.entity.ActivityParticipant;
import org.apache.ibatis.annotations.Param;

/**
 * 活动参与人表 Mapper。
 *
 * @author zhangliang
 */
public interface ActivityParticipantMapper extends BaseMapper<ActivityParticipant> {

    /**
     * 恢复已退出的参与记录。退出是逻辑删除，唯一索引仍占着这一行，不能再插入。
     */
    int restore(@Param("activityId") Long activityId,
                @Param("userId") Long userId,
                @Param("peopleCount") int peopleCount);
}
