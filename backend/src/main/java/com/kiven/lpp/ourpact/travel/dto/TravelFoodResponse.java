package com.kiven.lpp.ourpact.travel.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 旅行美食记录展示。
 *
 * @author zhangliang
 */
@Data
public class TravelFoodResponse {

    private Long id;

    private Long spotId;

    private String shopName;

    private String dishName;

    private String photoUrl;

    private String note;

    private LocalDateTime createdAt;
}
