package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 修改活动名称、时间和地点。答复后不允许再改。
 *
 * @author zhangliang
 */
@Data
public class ActivityUpdateRequest {

    @NotBlank(message = "请填写活动名称")
    @Size(max = 64, message = "活动名称不能超过 64 个字")
    private String name;

    @NotNull(message = "请选择活动时间")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "请填写活动地点")
    @Size(max = 128, message = "活动地点不能超过 128 个字")
    private String location;
}
