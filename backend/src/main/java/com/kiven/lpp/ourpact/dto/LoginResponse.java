package com.kiven.lpp.ourpact.dto;

import lombok.Data;

/**
 * 登录成功后返回的令牌和基础资料。
 *
 * @author zhangliang
 */
@Data
public class LoginResponse {

    private String token;

    private Long userId;

    private String username;

    private String nickname;

    private String phone;

    private String avatar;

    private Boolean superAdmin;
}
