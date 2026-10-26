package com.kiven.lpp.ourpact.user.dto;

import com.kiven.lpp.ourpact.common.PageQuery;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 管理端用户分页查询。
 *
 * @author zhangliang
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserPageQuery extends PageQuery {

    @Size(max = 64, message = "关键词不能超过 64 个字")
    private String keyword;
}
