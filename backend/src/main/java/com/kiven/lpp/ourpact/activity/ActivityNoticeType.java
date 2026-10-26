package com.kiven.lpp.ourpact.activity;

import com.kiven.lpp.ourpact.common.BaseEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 活动通知类型。
 *
 * @author zhangliang
 */
@Getter
@RequiredArgsConstructor
public enum ActivityNoticeType implements BaseEnum<String> {

    WITHDRAWN("withdrawn", "撤回");

    private final String value;

    private final String desc;
}
