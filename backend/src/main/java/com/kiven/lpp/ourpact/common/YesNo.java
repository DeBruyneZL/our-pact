package com.kiven.lpp.ourpact.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 是否标记。入库使用 value。
 *
 * @author zhangliang
 */
@Getter
@RequiredArgsConstructor
public enum YesNo implements BaseEnum<Integer> {

    NO(0, "否"),
    YES(1, "是");

    private final Integer value;

    private final String desc;
}
