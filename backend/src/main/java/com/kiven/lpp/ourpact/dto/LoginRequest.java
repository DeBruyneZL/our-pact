package com.kiven.lpp.ourpact.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求。
 *
 * @author zhangliang
 */
@Data
public class LoginRequest {

    @NotBlank(message = "账号不能为空")
    private String account;

    @NotBlank(message = "密码不能为空")
    private String password;
}
