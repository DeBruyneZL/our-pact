package com.kiven.lpp.ourpact.menu.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 一组特殊项。
 *
 * @author zhangliang
 */
@Data
public class OptionGroupRequest {

    private Long id;

    @NotBlank(message = "特殊项名称不能为空")
    @Size(max = 32, message = "特殊项名称不能超过 32 个字")
    private String name;

    @Valid
    @NotEmpty(message = "请填写可选值")
    private List<OptionValueRequest> values;
}
