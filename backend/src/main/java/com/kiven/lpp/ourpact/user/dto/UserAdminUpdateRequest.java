package com.kiven.lpp.ourpact.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 管理端设置或取消超级管理员。
 *
 * @author zhangliang
 */
@Data
public class UserAdminUpdateRequest {

    @NotNull(message = "请指定是否管理员")
    private Boolean superAdmin;
}
