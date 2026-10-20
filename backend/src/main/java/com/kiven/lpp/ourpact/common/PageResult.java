package com.kiven.lpp.ourpact.common;

import lombok.Data;

import java.util.List;

/**
 * 分页结果。由 {@link PageUtil#toResult} 组装，调用方不要自行 new。
 *
 * @param <T> 记录类型
 * @author zhangliang
 */
@Data
public class PageResult<T> {

    private List<T> list;

    private long total;

    private long pageNum;

    private long pageSize;
}
