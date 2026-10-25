package com.kiven.lpp.ourpact.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 个人资料修改。用户名和超级管理员标记不能在这里改。
 *
 * @author zhangliang
 */
@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "昵称不能为空")
    @Size(max = 64, message = "昵称不能超过 64 个字")
    private String nickname;

    /** 可空。小程序只改昵称时不强制填手机号。 */
    @Pattern(regexp = "^$|^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
}
