package com.kiven.lpp.ourpact.activity.controller;

import com.kiven.lpp.ourpact.activity.dto.ActivityJoinRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityItemsRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityNoticeResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityPageQuery;
import com.kiven.lpp.ourpact.activity.dto.ActivityReplyRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivitySaveRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityUpdateRequest;
import com.kiven.lpp.ourpact.activity.service.ActivityService;
import com.kiven.lpp.ourpact.common.PageResult;
import com.kiven.lpp.ourpact.common.Result;
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
 * 活动接口。登录用户可发起和加菜，答复与通知只给超级管理员。
 *
 * @author zhangliang
 */
@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public Result<ActivityResponse> add(@Valid @RequestBody ActivitySaveRequest request) {
        return Result.success(activityService.add(request));
    }

    @PostMapping("/page")
    public Result<PageResult<ActivityResponse>> page(@Valid @RequestBody ActivityPageQuery query) {
        return Result.success(activityService.page(query));
    }

    @PostMapping("/manage/page")
    public Result<PageResult<ActivityResponse>> managePage(@Valid @RequestBody ActivityPageQuery query) {
        return Result.success(activityService.managePage(query));
    }

    @GetMapping("/notices")
    public Result<List<ActivityNoticeResponse>> notices() {
        return Result.success(activityService.notices());
    }

    @PostMapping("/notices/{id}/read")
    public Result<Void> readNotice(@PathVariable Long id) {
        activityService.readNotice(id);
        return Result.success();
    }

    @GetMapping("/code/{shareCode}")
    public Result<ActivityResponse> detailByCode(@PathVariable String shareCode) {
        return Result.success(activityService.detailByCode(shareCode));
    }

    @PostMapping("/code/{shareCode}/join")
    public Result<ActivityResponse> join(@PathVariable String shareCode, @Valid @RequestBody ActivityJoinRequest request) {
        return Result.success(activityService.join(shareCode, request));
    }

    @PostMapping("/{id}/people")
    public Result<ActivityResponse> updatePeople(@PathVariable Long id, @Valid @RequestBody ActivityJoinRequest request) {
        return Result.success(activityService.updatePeople(id, request));
    }

    @PostMapping("/{id}/leave")
    public Result<ActivityResponse> leave(@PathVariable Long id) {
        return Result.success(activityService.leave(id));
    }

    @GetMapping("/{id}")
    public Result<ActivityResponse> detail(@PathVariable Long id) {
        return Result.success(activityService.detail(id));
    }

    @PostMapping("/{id}/update")
    public Result<ActivityResponse> update(@PathVariable Long id, @Valid @RequestBody ActivityUpdateRequest request) {
        return Result.success(activityService.update(id, request));
    }

    @PostMapping("/{id}/items")
    public Result<ActivityResponse> addItems(@PathVariable Long id, @Valid @RequestBody ActivityItemsRequest request) {
        return Result.success(activityService.addItems(id, request));
    }

    @PostMapping("/{id}/items/{itemId}/delete")
    public Result<ActivityResponse> deleteItem(@PathVariable Long id, @PathVariable Long itemId) {
        return Result.success(activityService.deleteItem(id, itemId));
    }

    @PostMapping("/{id}/withdraw")
    public Result<ActivityResponse> withdraw(@PathVariable Long id) {
        return Result.success(activityService.withdraw(id));
    }

    @PostMapping("/{id}/complete")
    public Result<ActivityResponse> complete(@PathVariable Long id) {
        return Result.success(activityService.complete(id));
    }

    @PostMapping("/{id}/reply")
    public Result<ActivityResponse> reply(@PathVariable Long id, @Valid @RequestBody ActivityReplyRequest request) {
        return Result.success(activityService.reply(id, request));
    }

    @PostMapping("/{id}/photos")
    public Result<ActivityResponse> uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return Result.success(activityService.uploadPhoto(id, file));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> delete(@PathVariable Long id) {
        activityService.delete(id);
        return Result.success();
    }
}
