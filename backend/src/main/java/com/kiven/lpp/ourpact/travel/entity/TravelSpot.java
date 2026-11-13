package com.kiven.lpp.ourpact.travel.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.kiven.lpp.ourpact.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 旅行点亮地点。一个地点一条记录，点亮后地图上整块区县发光。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("trip_spot")
public class TravelSpot extends BaseEntity {

    private String name;

    /** 省份快照，添加时由高德逆地理编码取到 */
    private String province;

    private String city;

    private String district;

    /** 区县行政区划编码，点亮边界按这个查，不靠名称 */
    private String adcode;

    private String cityAdcode;

    private String provinceAdcode;

    private BigDecimal lng;

    private BigDecimal lat;

    private String photoFileName;

    /** 取值见 {@link com.kiven.lpp.ourpact.travel.TravelStatus} */
    private String status;

    private LocalDate visitedOn;

    private String note;
}
