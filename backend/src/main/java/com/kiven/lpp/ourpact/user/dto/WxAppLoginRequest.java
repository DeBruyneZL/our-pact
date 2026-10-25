package com.kiven.lpp.ourpact.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 小程序静默登录请求。
 *
 * @author zhangliang
 */
@Data
public class WxAppLoginRequest {

    /** wx.login 返回的一次性登录凭证 */
    @NotBlank(message = "code 不能为空")
    private String code;
}
