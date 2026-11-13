package com.kiven.lpp.ourpact.travel;

import com.kiven.lpp.ourpact.common.BaseEnum;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 旅行地点状态。想去是提前标记的愿望，点亮表示真的去过。
 *
 * @author zhangliang
 */
@Getter
@RequiredArgsConstructor
public enum TravelStatus implements BaseEnum<String> {

    WISH("wish", "想去"),
    LIT("lit", "已点亮");

    private final String value;

    private final String desc;
}
