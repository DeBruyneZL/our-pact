package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    /** 未参加时必须带上分享码。已经参加的人可以不填。 */
    @Size(max = 32, message = "分享码不正确")
    private String shareCode;
}
