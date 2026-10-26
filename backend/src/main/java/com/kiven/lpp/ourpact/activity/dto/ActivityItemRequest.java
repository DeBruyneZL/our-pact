package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 活动里的一道菜。
 *
 * @author zhangliang
 */
@Data
public class ActivityItemRequest {

    @NotNull(message = "请选择菜品")
    private Long dishId;

    @Size(max = 100, message = "备注不能超过 100 个字")
    private String note;

    @Valid
    private List<ActivityOptionRequest> options;
}
