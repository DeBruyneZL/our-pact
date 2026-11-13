package com.kiven.lpp.ourpact.travel.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * 把想去的地点点亮。
 *
 * @author zhangliang
 */
@Data
public class TravelLightRequest {

    @NotNull(message = "请选择旅行时间")
    private LocalDate visitedOn;
}
