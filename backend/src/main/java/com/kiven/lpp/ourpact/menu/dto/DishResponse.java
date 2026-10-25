package com.kiven.lpp.ourpact.menu.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 菜品对外结构，图片已换成可访问路径。
 *
 * @author zhangliang
 */
@Data
public class DishResponse {

    private Long id;

    private Long categoryId;

    private String name;

    private String description;

    private String imageUrl;

    private Boolean isActive;

    private Integer sortOrder;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<OptionGroupResponse> optionGroups = new ArrayList<>();
}
