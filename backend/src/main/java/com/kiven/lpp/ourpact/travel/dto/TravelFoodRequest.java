package com.kiven.lpp.ourpact.travel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 添加美食记录。
 *
 * @author zhangliang
 */
@Data
public class TravelFoodRequest {

    @Size(max = 64, message = "店名不能超过 64 个字")
    private String shopName;

    @NotBlank(message = "请填写吃了什么")
    @Size(max = 64, message = "美食名称不能超过 64 个字")
    private String dishName;

    @Size(max = 255, message = "随记不能超过 255 个字")
    private String note;
}
