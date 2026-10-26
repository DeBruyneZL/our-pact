package com.kiven.lpp.ourpact.activity.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 活动照片。完成后由参与人上传。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("act_photo")
public class ActivityPhoto extends BaseEntity {

    private Long activityId;

    private Long userId;

    private String fileName;
}
