package com.kiven.lpp.ourpact.travel.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kiven.lpp.ourpact.common.BusinessException;
import com.kiven.lpp.ourpact.travel.TravelStatus;
import com.kiven.lpp.ourpact.travel.dto.TravelFoodRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelFoodResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelLightRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSaveRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSpotResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelStatsResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelUpdateRequest;
import com.kiven.lpp.ourpact.travel.entity.TravelFood;
import com.kiven.lpp.ourpact.travel.entity.TravelSpot;
import com.kiven.lpp.ourpact.travel.service.TravelFoodService;
import com.kiven.lpp.ourpact.travel.service.TravelPhotoStorage;
import com.kiven.lpp.ourpact.travel.service.TravelService;
import com.kiven.lpp.ourpact.travel.service.TravelSpotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 旅行记录规则：想去的地点先标记，到地方再点亮；点亮照片和美食记录分开，都挂在地点下面。
 * 统计只算已点亮的地点，按省市区快照去重。
 *
 * @author zhangliang
 */
@Service
@RequiredArgsConstructor
public class TravelServiceImpl implements TravelService {

    private final TravelSpotService spotService;

    private final TravelFoodService foodService;

    private final TravelPhotoStorage photoStorage;

    @Override
    public TravelSpotResponse add(TravelSaveRequest request) {
        TravelStatus status = parseStatus(request.getStatus());
        if (status == TravelStatus.LIT && request.getVisitedOn() == null) {
            throw new BusinessException("请选择旅行时间");
        }
        TravelSpot spot = new TravelSpot();
        spot.setName(request.getName());
        spot.setProvince(request.getProvince());
        spot.setCity(request.getCity());
        spot.setDistrict(request.getDistrict());
        spot.setAdcode(request.getAdcode());
        spot.setCityAdcode(request.getCityAdcode());
        spot.setProvinceAdcode(request.getProvinceAdcode());
        spot.setLng(request.getLng());
        spot.setLat(request.getLat());
        spot.setStatus(status.getValue());
        spot.setVisitedOn(request.getVisitedOn());
        spot.setNote(request.getNote());
        spotService.save(spot);
        return assembleOne(spot, List.of());
    }

    @Override
    public TravelSpotResponse light(Long id, TravelLightRequest request) {
        TravelSpot spot = requireSpot(id);
        if (TravelStatus.LIT.getValue().equals(spot.getStatus())) {
            throw new BusinessException("这个地点已经点亮过了");
        }
        spot.setStatus(TravelStatus.LIT.getValue());
        spot.setVisitedOn(request.getVisitedOn());
        spotService.updateById(spot);
        return detail(id);
    }

    @Override
    public TravelSpotResponse update(Long id, TravelUpdateRequest request) {
        TravelSpot spot = requireSpot(id);
        if (request.getName() != null) {
            spot.setName(request.getName());
        }
        if (request.getVisitedOn() != null) {
            spot.setVisitedOn(request.getVisitedOn());
        }
        if (request.getNote() != null) {
            spot.setNote(request.getNote());
        }
        if (request.getProvince() != null) {
            spot.setProvince(request.getProvince());
        }
        if (request.getCity() != null) {
            spot.setCity(request.getCity());
        }
        if (request.getDistrict() != null) {
            spot.setDistrict(request.getDistrict());
        }
        if (request.getAdcode() != null) {
            spot.setAdcode(request.getAdcode());
        }
        if (request.getCityAdcode() != null) {
            spot.setCityAdcode(request.getCityAdcode());
        }
        if (request.getProvinceAdcode() != null) {
            spot.setProvinceAdcode(request.getProvinceAdcode());
        }
        spotService.updateById(spot);
        return detail(id);
    }

    @Override
    public TravelSpotResponse uploadPhoto(Long id, MultipartFile file) {
        TravelSpot spot = requireSpot(id);
        String oldName = spot.getPhotoFileName();
        spot.setPhotoFileName(photoStorage.save(file));
        spotService.updateById(spot);
        photoStorage.delete(oldName);
        return detail(id);
    }

    @Override
    @Transactional(rollbackFor = Throwable.class)
    public void delete(Long id) {
        TravelSpot spot = requireSpot(id);
        List<TravelFood> foods = foodService.list(Wrappers.<TravelFood>lambdaQuery()
                .eq(TravelFood::getSpotId, id));
        spotService.removeById(id);
        if (!foods.isEmpty()) {
            foodService.removeByIds(foods.stream().map(TravelFood::getId).toList());
        }
        photoStorage.delete(spot.getPhotoFileName());
        foods.forEach(food -> photoStorage.delete(food.getPhotoFileName()));
    }

    @Override
    public List<TravelSpotResponse> list() {
        List<TravelSpot> spots = spotService.list(Wrappers.<TravelSpot>lambdaQuery()
                .orderByAsc(TravelSpot::getStatus)
                .orderByDesc(TravelSpot::getVisitedOn)
                .orderByDesc(TravelSpot::getId));
        if (spots.isEmpty()) {
            return List.of();
        }
        List<Long> spotIds = spots.stream().map(TravelSpot::getId).toList();
        Map<Long, List<TravelFood>> foodsBySpot = foodService.list(Wrappers.<TravelFood>lambdaQuery()
                        .in(TravelFood::getSpotId, spotIds))
                .stream()
                .collect(Collectors.groupingBy(TravelFood::getSpotId));
        return spots.stream()
                .map(spot -> assembleOne(spot, foodsBySpot.getOrDefault(spot.getId(), List.of())))
                .toList();
    }

    @Override
    public TravelStatsResponse stats() {
        Map<String, List<TravelSpot>> byStatus = spotService.list().stream()
                .collect(Collectors.groupingBy(TravelSpot::getStatus));
        List<TravelSpot> litSpots = byStatus.getOrDefault(TravelStatus.LIT.getValue(), List.of());
        TravelStatsResponse stats = new TravelStatsResponse();
        stats.setLitCount(litSpots.size());
        stats.setWishCount(byStatus.getOrDefault(TravelStatus.WISH.getValue(), List.of()).size());
        stats.setDistrictCount(countDistinct(litSpots, spot -> firstText(spot.getAdcode(), spot.getDistrict())));
        stats.setCityCount(countDistinct(litSpots, spot -> firstText(spot.getCityAdcode(), spot.getCity())));
        stats.setProvinceCount(countDistinct(litSpots, spot -> firstText(spot.getProvinceAdcode(), spot.getProvince())));
        return stats;
    }

    @Override
    public TravelSpotResponse addFood(Long id, TravelFoodRequest request) {
        TravelSpot spot = requireSpot(id);
        TravelFood food = new TravelFood();
        food.setSpotId(spot.getId());
        food.setShopName(request.getShopName());
        food.setDishName(request.getDishName());
        food.setNote(request.getNote());
        foodService.save(food);
        return detail(id);
    }

    @Override
    public TravelSpotResponse uploadFoodPhoto(Long foodId, MultipartFile file) {
        TravelFood food = requireFood(foodId);
        String oldName = food.getPhotoFileName();
        food.setPhotoFileName(photoStorage.save(file));
        foodService.updateById(food);
        photoStorage.delete(oldName);
        return detail(food.getSpotId());
    }

    @Override
    public void deleteFood(Long foodId) {
        TravelFood food = requireFood(foodId);
        foodService.removeById(foodId);
        photoStorage.delete(food.getPhotoFileName());
    }

    private TravelSpotResponse detail(Long id) {
        TravelSpot spot = requireSpot(id);
        List<TravelFood> foods = foodService.list(Wrappers.<TravelFood>lambdaQuery()
                .eq(TravelFood::getSpotId, id)
                .orderByDesc(TravelFood::getId));
        return assembleOne(spot, foods);
    }

    private TravelSpotResponse assembleOne(TravelSpot spot, List<TravelFood> foods) {
        TravelSpotResponse response = new TravelSpotResponse();
        response.setId(spot.getId());
        response.setName(spot.getName());
        response.setProvince(spot.getProvince());
        response.setCity(spot.getCity());
        response.setDistrict(spot.getDistrict());
        response.setAdcode(spot.getAdcode());
        response.setCityAdcode(spot.getCityAdcode());
        response.setProvinceAdcode(spot.getProvinceAdcode());
        response.setLng(spot.getLng());
        response.setLat(spot.getLat());
        response.setPhotoUrl(photoStorage.url(spot.getPhotoFileName()));
        response.setStatus(spot.getStatus());
        response.setVisitedOn(spot.getVisitedOn());
        response.setNote(spot.getNote());
        response.setCreatedAt(spot.getCreateTime());
        response.setFoods(foods.stream().map(this::assembleFood).toList());
        return response;
    }

    private TravelFoodResponse assembleFood(TravelFood food) {
        TravelFoodResponse response = new TravelFoodResponse();
        response.setId(food.getId());
        response.setSpotId(food.getSpotId());
        response.setShopName(food.getShopName());
        response.setDishName(food.getDishName());
        response.setPhotoUrl(photoStorage.url(food.getPhotoFileName()));
        response.setNote(food.getNote());
        response.setCreatedAt(food.getCreateTime());
        return response;
    }

    private long countDistinct(List<TravelSpot> spots, Function<TravelSpot, String> field) {
        return spots.stream()
                .map(field)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .count();
    }

    private String firstText(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        return fallback;
    }

    private TravelStatus parseStatus(String value) {
        for (TravelStatus status : TravelStatus.values()) {
            if (status.getValue().equals(value)) {
                return status;
            }
        }
        throw new BusinessException("地点状态不合法");
    }

    private TravelSpot requireSpot(Long id) {
        TravelSpot spot = spotService.getById(id);
        if (spot == null) {
            throw new BusinessException("地点不存在");
        }
        return spot;
    }

    private TravelFood requireFood(Long id) {
        TravelFood food = foodService.getById(id);
        if (food == null) {
            throw new BusinessException("美食记录不存在");
        }
        return food;
    }
}
