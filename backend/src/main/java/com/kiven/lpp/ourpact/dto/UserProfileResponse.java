package com.kiven.lpp.ourpact.dto;

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
}
