package com.kiven.lpp.ourpact.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 特殊项里的一个可选值。
 *
 * @author zhangliang
 */
@Data
public class OptionValueRequest {

    private Long id;

    @NotBlank(message = "可选值不能为空")
    @Size(max = 32, message = "可选值不能超过 32 个字")
    private String label;
}
