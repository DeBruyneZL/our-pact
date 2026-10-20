package com.kiven.lpp.ourpact.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 通用错误码。业务专属错误优先抛带明确文案的 {@link BusinessException}。
 *
 * @author zhangliang
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    BIZ_ERROR(1, "业务处理失败"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    SERVER_ERROR(500, "服务器异常");

    private final int code;

    private final String message;
}
