package com.kiven.lpp.ourpact.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增或修改分类。
 *
 * @author zhangliang
 */
@Data
public class CategorySaveRequest {

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 32, message = "分类名称不能超过 32 个字")
    private String name;

    private Integer sortOrder;
}
