package com.kiven.lpp.ourpact.travel.dto;

import lombok.Data;

/**
 * 旅行点亮统计。省份、城市、区县都按快照字段去重，只统计已点亮的地点。
 *
 * @author zhangliang
 */
@Data
public class TravelStatsResponse {

    /** 想去的地点数 */
    private long wishCount;

    /** 已点亮的地点数 */
    private long litCount;

    /** 已点亮的区县数 */
    private long districtCount;

    /** 已点亮的城市数 */
    private long cityCount;

    /** 已点亮的省份数 */
    private long provinceCount;
}
