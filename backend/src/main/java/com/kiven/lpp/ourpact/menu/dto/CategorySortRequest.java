package com.kiven.lpp.ourpact.menu.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 分类的新顺序，列表从前到后即展示顺序。
 *
 * @author zhangliang
 */
@Data
public class CategorySortRequest {

    @NotEmpty(message = "请提交分类顺序")
    private List<Long> ids;
}
