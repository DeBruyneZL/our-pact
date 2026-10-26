package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 加菜时选中的特殊项。
 *
 * @author zhangliang
 */
@Data
public class ActivityOptionRequest {

    @NotNull(message = "请选择特殊项")
    private Long groupId;

    @NotNull(message = "请选择特殊项")
    private Long valueId;
}
