package com.kiven.lpp.ourpact.common;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 分页查询入参。列表 Form 继承本类，页码从 1 开始。
 *
 * @author zhangliang
 */
@Data
public class PageQuery {

    @Min(value = 1, message = "页码必须大于 0")
    private Long pageNum = 1L;

    @Min(value = 1, message = "每页条数必须大于 0")
    @Max(value = 200, message = "每页条数不能超过 200")
    private Long pageSize = 10L;
}
