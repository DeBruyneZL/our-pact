package com.kiven.lpp.ourpact.activity.dto;

import com.kiven.lpp.ourpact.common.PageQuery;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 活动分页查询。userId 由服务端写入，不接收前端传入。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ActivityPageQuery extends PageQuery {

    @Size(max = 16, message = "状态不正确")
    private String status;

    private Long userId;
}
