package com.kiven.lpp.ourpact.travel.controller;

import com.kiven.lpp.ourpact.common.Result;
import com.kiven.lpp.ourpact.travel.dto.TravelFoodRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelLightRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSaveRequest;
import com.kiven.lpp.ourpact.travel.dto.TravelSpotResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelStatsResponse;
import com.kiven.lpp.ourpact.travel.dto.TravelUpdateRequest;
import com.kiven.lpp.ourpact.travel.service.TravelService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 旅行记录接口。登录的管理员可以维护想去的地点、点亮、照片、美食记录和统计。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/travels")
public class TravelController {

    private final TravelService travelService;

    public TravelController(TravelService travelService) {
        this.travelService = travelService;
    }

    @PostMapping("/add")
    public Result<TravelSpotResponse> add(@Valid @RequestBody TravelSaveRequest request) {
        return Result.success(travelService.add(request));
    }

    @PostMapping("/{id}/light")
    public Result<TravelSpotResponse> light(@PathVariable Long id, @Valid @RequestBody TravelLightRequest request) {
        return Result.success(travelService.light(id, request));
    }

    @PostMapping("/{id}/update")
    public Result<TravelSpotResponse> update(@PathVariable Long id, @Valid @RequestBody TravelUpdateRequest request) {
        return Result.success(travelService.update(id, request));
    }

    @PostMapping("/{id}/photo")
    public Result<TravelSpotResponse> uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return Result.success(travelService.uploadPhoto(id, file));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> delete(@PathVariable Long id) {
        travelService.delete(id);
        return Result.success();
    }

    @GetMapping("/list")
    public Result<List<TravelSpotResponse>> list() {
        return Result.success(travelService.list());
    }

    @GetMapping("/stats")
    public Result<TravelStatsResponse> stats() {
        return Result.success(travelService.stats());
    }

    @PostMapping("/{id}/foods/add")
    public Result<TravelSpotResponse> addFood(@PathVariable Long id, @Valid @RequestBody TravelFoodRequest request) {
        return Result.success(travelService.addFood(id, request));
    }

    @PostMapping("/foods/{foodId}/photo")
    public Result<TravelSpotResponse> uploadFoodPhoto(@PathVariable Long foodId, @RequestParam("file") MultipartFile file) {
        return Result.success(travelService.uploadFoodPhoto(foodId, file));
    }

    @PostMapping("/foods/{foodId}/delete")
    public Result<Void> deleteFood(@PathVariable Long foodId) {
        travelService.deleteFood(foodId);
        return Result.success();
    }
}
