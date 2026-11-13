package com.kiven.lpp.ourpact.travel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 添加旅行地点。省市区由前端用高德逆地理编码取到后一并传入。
 *
 * @author zhangliang
 */
@Data
public class TravelSaveRequest {

    @NotBlank(message = "请填写地点名称")
    @Size(max = 64, message = "地点名称不能超过 64 个字")
    private String name;

    @Size(max = 32, message = "省份不能超过 32 个字")
    private String province;

    @Size(max = 32, message = "城市不能超过 32 个字")
    private String city;

    @Size(max = 32, message = "区县不能超过 32 个字")
    private String district;

    /** 区县行政区划编码。同名区县靠它区分，也用来取边界。 */
    @Size(max = 12, message = "行政区划编码不正确")
    private String adcode;

    @Size(max = 12, message = "行政区划编码不正确")
    private String cityAdcode;

    @Size(max = 12, message = "行政区划编码不正确")
    private String provinceAdcode;

    @NotNull(message = "缺少经纬度")
    private BigDecimal lng;

    @NotNull(message = "缺少经纬度")
    private BigDecimal lat;

    /** 见 {@link com.kiven.lpp.ourpact.travel.TravelStatus} */
    @NotBlank(message = "缺少状态")
    private String status;

    /** 直接点亮时必填，想去可以不填 */
    private LocalDate visitedOn;

    @Size(max = 255, message = "随记不能超过 255 个字")
    private String note;
}
