package com.kiven.lpp.ourpact.travel.service;

import com.kiven.lpp.ourpact.travel.dto.TravelFoodRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelLightRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSaveRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSpotResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelStatsResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 旅行记录：想去的地点、点亮、照片、美食记录和统计。
 *
 * @author zhangliang
 */
public interface TravelService {

    /**
     * 添加地点。直接点亮时必须带旅行时间。
     */
    TravelSpotResponse add(TravelSaveRequest request);

    /**
     * 把想去的地点点亮，补上旅行时间。
     */
    TravelSpotResponse light(Long id, TravelLightRequest request);

    /**
     * 改名称、旅行时间和随记。
     */
    TravelSpotResponse update(Long id, TravelUpdateRequest request);

    /**
     * 上传地点照片，替换旧照片。
     */
    TravelSpotResponse uploadPhoto(Long id, MultipartFile file);

    /**
     * 取消地点，连同美食记录一起删。
     */
    void delete(Long id);

    /**
     * 全量地点，给地图和照片墙渲染。数据量小不分页。
     */
    List<TravelSpotResponse> list();

    /**
     * 点亮统计，省份、城市、区县按快照字段去重。
     */
    TravelStatsResponse stats();

    /**
     * 在地点下添加美食记录。
     */
    TravelSpotResponse addFood(Long id, TravelFoodRequest request);

    /**
     * 上传美食照片，替换旧照片。
     */
    TravelSpotResponse uploadFoodPhoto(Long foodId, MultipartFile file);

    /**
     * 删除一条美食记录。
     */
    void deleteFood(Long foodId);
}
