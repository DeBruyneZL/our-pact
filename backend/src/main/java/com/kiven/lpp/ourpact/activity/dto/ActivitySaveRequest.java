package com.kiven.lpp.ourpact.activity.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 发起活动。
 *
 * @author zhangliang
 */
@Data
public class ActivitySaveRequest {

    /** 可不填。为空时后端按「谁发起的几月几号的小聚」生成默认名。 */
    @Size(max = 64, message = "活动名称不能超过 64 个字")
    private String name;

    @NotNull(message = "请选择活动时间")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "请填写活动地点")
    @Size(max = 128, message = "活动地点不能超过 128 个字")
    private String location;

    /** 发起人一方人数。不填按 1 人。 */
    @Min(value = 1, message = "人数至少为 1")
    @Max(value = 20, message = "人数不能超过 20")
    private Integer peopleCount;

    /** 可以先不选菜，活动过程中再加。 */
    @Size(max = 30, message = "一次最多 30 道菜")
    @Valid
    private List<ActivityItemRequest> items;
}
