package com.kiven.lpp.ourpact.menu.dto;

import lombok.Data;

/**
 * 分类对外结构。
 *
 * @author zhangliang
 */
@Data
public class CategoryResponse {

    private Long id;

    private String name;

    private Integer sortOrder;
}
