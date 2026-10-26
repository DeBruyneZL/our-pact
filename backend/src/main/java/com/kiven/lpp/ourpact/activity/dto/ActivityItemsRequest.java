package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 往活动里加菜。
 *
 * @author zhangliang
 */
@Data
public class ActivityItemsRequest {

    @NotEmpty(message = "请至少选择一道菜")
    @Size(max = 30, message = "一次最多 30 道菜")
    @Valid
    private List<ActivityItemRequest> items;
}
