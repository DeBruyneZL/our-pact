package com.kiven.lpp.ourpact.travel.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 旅行地点展示。
 *
 * @author zhangliang
 */
@Data
public class TravelSpotResponse {

    private Long id;

    private String name;

    private String province;

    private String city;

    private String district;

    private String adcode;

    private String cityAdcode;

    private String provinceAdcode;

    private BigDecimal lng;

    private BigDecimal lat;

    private String photoUrl;

    /** 见 {@link com.kiven.lpp.ourpact.travel.TravelStatus} */
    private String status;

    private LocalDate visitedOn;

    private String note;

    private LocalDateTime createdAt;

    private List<TravelFoodResponse> foods;
}
