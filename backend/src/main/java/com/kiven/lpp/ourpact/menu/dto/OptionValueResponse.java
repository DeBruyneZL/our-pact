package com.kiven.lpp.ourpact.menu.dto;

import lombok.Data;

/**
 * 特殊项可选值对外结构。
 *
 * @author zhangliang
 */
@Data
public class OptionValueResponse {

    private Long id;

    private String label;

    private Integer sortOrder;
}
