package com.kiven.lpp.ourpact.user.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 当前登录用户资料。不包含密码。
 *
 * @author zhangliang
 */
@Data
public class UserProfileResponse {

    private Long id;

    private String username;

    private String nickname;

    private String phone;

    private String avatar;

    private Boolean superAdmin;

    private LocalDateTime createTime;

    /** 参加过的活动次数（发起 + 加入）。 */
    private Integer activityCount;

    /** 点过的菜数量（自己加到活动里的菜）。 */
    private Integer dishCount;
}
