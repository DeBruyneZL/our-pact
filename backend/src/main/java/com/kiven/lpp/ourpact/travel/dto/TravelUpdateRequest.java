package com.kiven.lpp.ourpact.travel.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 修改旅行地点。只允许改名称、旅行时间和随记，坐标不移动。
 *
 * @author zhangliang
 */
@Data
public class TravelUpdateRequest {

    @Size(max = 64, message = "地点名称不能超过 64 个字")
    private String name;

    private LocalDate visitedOn;

    @Size(max = 255, message = "随记不能超过 255 个字")
    private String note;

    @Size(max = 32, message = "省份不能超过 32 个字")
    private String province;

    @Size(max = 32, message = "城市不能超过 32 个字")
    private String city;

    @Size(max = 32, message = "区县不能超过 32 个字")
    private String district;

    @Size(max = 12, message = "行政区划编码不正确")
    private String adcode;

    @Size(max = 12, message = "行政区划编码不正确")
    private String cityAdcode;

    @Size(max = 12, message = "行政区划编码不正确")
    private String provinceAdcode;
}
