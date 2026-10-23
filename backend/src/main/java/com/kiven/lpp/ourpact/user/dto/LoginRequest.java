package com.kiven.lpp.ourpact.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 登录请求。
 *
 * @author zhangliang
 */
@Data
public class LoginRequest {

    @NotBlank(message = "账号不能为空")
    @Size(max = 64, message = "账号不能超过 64 个字")
    private String account;

    @NotBlank(message = "密码不能为空")
    @Size(max = 64, message = "密码不能超过 64 个字")
    private String password;
}
