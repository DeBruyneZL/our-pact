package com.kiven.lpp.ourpact.activity;

import com.kiven.lpp.ourpact.common.BaseEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 活动状态。答复不是审批，不挡住加菜；答复后不能再改原内容。
 *
 * @author zhangliang
 */
@Getter
@RequiredArgsConstructor
public enum ActivityStatus implements BaseEnum<String> {

    OPEN("open", "待确认"),
    REPLIED("replied", "待参加"),
    WITHDRAWN("withdrawn", "已取消"),
    COMPLETED("completed", "已完成");

    private final String value;

    private final String desc;
}
