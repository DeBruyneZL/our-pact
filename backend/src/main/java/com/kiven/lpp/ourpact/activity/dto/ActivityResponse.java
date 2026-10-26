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

    private boolean canAdd;

    private boolean canEdit;

    private boolean canWithdraw;

    private boolean canComplete;

    private boolean canUpload;
}
