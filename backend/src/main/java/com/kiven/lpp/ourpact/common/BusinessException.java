package com.kiven.lpp.ourpact.common;

import lombok.Getter;

/**
 * 可预期的业务错误，由全局异常处理转成统一响应。
 *
 * @author zhangliang
 */
@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        this(ErrorCode.BIZ_ERROR.getCode(), message);
    }

    public BusinessException(ErrorCode errorCode) {
        this(errorCode.getCode(), errorCode.getMessage());
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
