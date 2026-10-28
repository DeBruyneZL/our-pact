package com.kiven.lpp.ourpact.menu.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 新增或修改菜品。图片先走上传接口，这里只收访问路径。
 *
 * @author zhangliang
 */
@Data
public class DishSaveRequest {

    @NotNull(message = "请选择分类")
    private Long categoryId;

    @NotBlank(message = "菜品名称不能为空")
    @Size(max = 64, message = "菜品名称不能超过 64 个字")
    private String name;

    @Size(max = 500, message = "描述不能超过 500 个字")
    private String description;

    private String imageUrl;

    private Boolean isActive;

    /** 不传或 false 时，同一活动里这道菜只能出现一次。 */
    private Boolean allowRepeat;

    private Integer sortOrder;

    @Valid
    private List<OptionGroupRequest> optionGroups;
}
