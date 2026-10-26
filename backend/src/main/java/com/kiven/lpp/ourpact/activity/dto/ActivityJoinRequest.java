package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 确认参加活动时填写的人数。
 *
 * @author zhangliang
 */
@Data
public class ActivityJoinRequest {

    @NotNull(message = "请填写人数")
    @Min(value = 1, message = "人数至少为 1")
    @Max(value = 20, message = "人数不能超过 20")
    private Integer peopleCount;
}
