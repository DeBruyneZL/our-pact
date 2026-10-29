package com.kiven.lpp.ourpact.activity.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 活动详情。
 *
 * @author zhangliang
 */
@Data
public class ActivityResponse {

    private Long id;

    private String name;

    private String shareCode;

    private Long userId;

    private String userName;

    private LocalDateTime scheduledAt;

    private String location;

    /** 发起人一方人数 */
    private Integer peopleCount;

    /** 所有参与方人数合计 */
    private Integer totalPeople;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime repliedAt;

    private String replyNote;

    private LocalDateTime withdrawnAt;

    private LocalDateTime completedAt;

    private List<Long> participantIds;

    private List<ActivityParticipantResponse> participants;

    private List<ActivityItemResponse> items;

    private List<ActivityPhotoResponse> photos;

    private boolean owner;

    /** 当前用户自己这边填的人数（发起人取活动人数，参与人取参与记录）。 */
    private Integer myPeopleCount;

    private boolean canAdd;

    private boolean canEdit;

    private boolean canWithdraw;

    private boolean canComplete;

    private boolean canUpload;

    /** 已参加的非发起人可退出。 */
    private boolean canLeave;

    /** 已参加且活动未结束时可改自己的人数。 */
    private boolean canUpdatePeople;

    /** 超级管理员对待确认活动可答复。 */
    private boolean canReply;
}
