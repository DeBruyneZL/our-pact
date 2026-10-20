package com.kiven.lpp.ourpact.common;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

/**
 * MyBatis-Plus 分页与 {@link PageResult} 的转换。
 *
 * @author zhangliang
 */
public final class PageUtil {

    private static final long DEFAULT_PAGE_NUM = 1L;

    private static final long DEFAULT_PAGE_SIZE = 10L;

    private static final long MAX_PAGE_SIZE = 200L;

    private PageUtil() {
    }

    /**
     * 把分页入参收成 MyBatis-Plus 的分页对象，并限制单页上限。
     */
    public static <T> Page<T> toPage(PageQuery query) {
        long pageNum = DEFAULT_PAGE_NUM;
        long pageSize = DEFAULT_PAGE_SIZE;
        if (query != null && query.getPageNum() != null && query.getPageNum() > 0) {
            pageNum = query.getPageNum();
        }
        if (query != null && query.getPageSize() != null && query.getPageSize() > 0) {
            pageSize = Math.min(query.getPageSize(), MAX_PAGE_SIZE);
        }
        return new Page<>(pageNum, pageSize);
    }

    /**
     * 把分页插件的结果转成接口返回结构。
     */
    public static <T> PageResult<T> toResult(IPage<T> page) {
        PageResult<T> result = new PageResult<>();
        result.setList(page.getRecords());
        result.setTotal(page.getTotal());
        result.setPageNum(page.getCurrent());
        result.setPageSize(page.getSize());
        return result;
    }
}
