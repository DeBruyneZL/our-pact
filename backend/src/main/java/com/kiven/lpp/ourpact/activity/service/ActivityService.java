package com.kiven.lpp.ourpact.activity.service;

import com.kiven.lpp.ourpact.activity.dto.ActivityJoinRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityItemsRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityNoticeResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivityPageQuery;
import com.kiven.lpp.ourpact.activity.dto.ActivityReplyRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityResponse;
import com.kiven.lpp.ourpact.activity.dto.ActivitySaveRequest;
import com.kiven.lpp.ourpact.activity.dto.ActivityUpdateRequest;
import com.kiven.lpp.ourpact.common.PageResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 活动：发起、加菜、答复、撤回和完成后的照片。
 *
 * @author zhangliang
 */
public interface ActivityService {

    /**
     * 当前用户发起活动。
     */
    ActivityResponse add(ActivitySaveRequest request);

    /**
     * 当前用户发起或参与的活动。
     */
    PageResult<ActivityResponse> page(ActivityPageQuery query);

    /**
     * 管理端查看全部活动。
     */
    PageResult<ActivityResponse> managePage(ActivityPageQuery query);

    /**
     * 登录用户查看活动。未加入的人也可以看，用来从分享卡片进入后再参加。
     */
    ActivityResponse detail(Long id);

    /**
     * 确认参加并填写人数。已撤回或已完成不能加入。
     */
    ActivityResponse join(Long id, ActivityJoinRequest request);

    /**
     * 已参加的人修改自己这边的人数。发起人改活动人数，参与人改参与记录。
     */
    ActivityResponse updatePeople(Long id, ActivityJoinRequest request);

    /**
     * 参与人退出活动，并移除自己加的菜；退出后推送发起人。
     */
    ActivityResponse leave(Long id);

    /**
     * 发起人在答复前修改名称、时间和地点。
     */
    ActivityResponse update(Long id, ActivityUpdateRequest request);

    /**
     * 参与人加自己的菜。答复后仍可以加，不能改别人的菜。
     */
    ActivityResponse addItems(Long id, ActivityItemsRequest request);

    /**
     * 删除自己加的菜。答复后不能再删。
     */
    ActivityResponse deleteItem(Long id, Long itemId);

    /**
     * 发起人撤回，并通知管理员。已完成不能撤回。
     */
    ActivityResponse withdraw(Long id);

    /**
     * 发起人标记完成，之后参与人可以上传照片。
     */
    ActivityResponse complete(Long id);

    /**
     * 管理员答复。答复不是审批，也不挡住加菜。
     */
    ActivityResponse reply(Long id, ActivityReplyRequest request);

    /**
     * 完成后，参与人上传一张照片。
     */
    ActivityResponse uploadPhoto(Long id, MultipartFile file);

    /**
     * 上传人删除自己的照片。
     */
    ActivityResponse deletePhoto(Long id, Long photoId);

    /**
     * 管理员删除活动。
     */
    void delete(Long id);

    /**
     * 管理员查看撤回通知。
     */
    List<ActivityNoticeResponse> notices();

    /**
     * 管理员把通知标成已读。
     */
    void readNotice(Long id);
}
